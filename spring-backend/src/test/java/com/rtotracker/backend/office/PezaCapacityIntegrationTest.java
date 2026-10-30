package com.rtotracker.backend.office;

import com.rtotracker.backend.platform.Platform;
import com.rtotracker.backend.platform.PlatformRepository;
import com.rtotracker.backend.settings.GlobalSettings;
import com.rtotracker.backend.settings.GlobalSettingsRepository;
import com.rtotracker.backend.settings.SchedulingMode;
import com.rtotracker.backend.settings.SettingsService;
import com.rtotracker.backend.user.User;
import com.rtotracker.backend.user.UserRepository;
import jakarta.persistence.EntityManagerFactory;
import org.junit.jupiter.api.Test;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import javax.sql.DataSource;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Objects;
import java.util.Properties;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static org.junit.jupiter.api.Assertions.*;

@SpringJUnitConfig(PezaCapacityIntegrationTest.Config.class)
class PezaCapacityIntegrationTest {
    @Autowired private OfficeDayService service;
    @Autowired private SettingsService settings;
    @Autowired private GlobalSettingsRepository globals;
    @Autowired private PlatformRepository platforms;
    @Autowired private UserRepository users;
    @Autowired private JpaTransactionManager transactionManager;

    @Test
    void waitingSaveSeesCommittedLastSlotAndCanBookAfterItIsReleased() throws Exception {
        globals.saveAndFlush(new GlobalSettings());
        var platform = platforms.saveAndFlush(new Platform("PEZA team"));
        for (String email : List.of("first@example.com", "second@example.com")) {
            var user = new User(email, "hash");
            user.setPlatform(platform);
            users.saveAndFlush(user);
        }
        settings.updateGlobal(false, false, SchedulingMode.PEZA);
        @NonNull LocalDate date = Objects.requireNonNull(LocalDate.now().plusDays(2));
        var month = YearMonth.from(date);
        assertEquals(1L, service.getMonthlySchedule("first@example.com", month).dailyCapacity());
        var firstSaved = new CountDownLatch(1);
        var allowCommit = new CountDownLatch(1);
        var secondStarted = new CountDownLatch(1);
        var transaction = new TransactionTemplate(transactionManager);
        transaction.setIsolationLevel(TransactionDefinition.ISOLATION_REPEATABLE_READ);

        try (var workers = Executors.newFixedThreadPool(2)) {
            var first = workers.submit(() -> transaction.executeWithoutResult(status -> {
                service.replaceMonth("first@example.com", month, List.of(date));
                firstSaved.countDown();
                await(allowCommit);
            }));
            assertTrue(firstSaved.await(10, TimeUnit.SECONDS));
            var second = workers.submit(() -> {
                secondStarted.countDown();
                return assertThrows(ResponseStatusException.class,
                        () -> transaction.execute(status -> service.replaceMonth("second@example.com", month, List.of(date))));
            });
            try {
                assertTrue(secondStarted.await(5, TimeUnit.SECONDS));
                assertThrows(TimeoutException.class, () -> second.get(200, TimeUnit.MILLISECONDS));
            } finally {
                allowCommit.countDown();
            }
            first.get(10, TimeUnit.SECONDS);
            assertEquals(409, second.get(10, TimeUnit.SECONDS).getStatusCode().value());
        } finally {
            allowCommit.countDown();
        }

        assertEquals(List.of(date), service.getSchedule("first@example.com", month).officeDays());
        assertEquals(List.of(), service.getSchedule("second@example.com", month).officeDays());
        service.replaceMonth("first@example.com", month, List.of());
        service.replaceMonth("second@example.com", month, List.of(date));
        assertEquals(List.of(date), service.getSchedule("second@example.com", month).officeDays());
    }

    private static void await(CountDownLatch latch) {
        try {
            if (!latch.await(10, TimeUnit.SECONDS)) throw new AssertionError("Timed out waiting to commit");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new AssertionError(exception);
        }
    }

    @Configuration
    @EnableTransactionManagement
    @EnableJpaRepositories(basePackageClasses = {OfficeDayRepository.class, UserRepository.class,
            PlatformRepository.class, GlobalSettingsRepository.class})
    @Import({OfficeDayService.class, SettingsService.class})
    static class Config {
        @Bean
        DataSource dataSource() {
            var source = new DriverManagerDataSource("jdbc:h2:mem:peza;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=5000", "sa", "");
            source.setDriverClassName("org.h2.Driver");
            return source;
        }

        @Bean
        LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource) {
            var factory = new LocalContainerEntityManagerFactoryBean();
            factory.setDataSource(dataSource);
            factory.setPackagesToScan("com.rtotracker.backend");
            factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
            var properties = new Properties();
            properties.setProperty("hibernate.hbm2ddl.auto", "create-drop");
            factory.setJpaProperties(properties);
            return factory;
        }

        @Bean
        JpaTransactionManager transactionManager(EntityManagerFactory factory) {
            return new JpaTransactionManager(factory);
        }
    }
}

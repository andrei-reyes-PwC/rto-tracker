package com.rtotracker.backend.site;

import com.rtotracker.backend.user.User;
import com.rtotracker.backend.user.UserSelectionService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@Service
@Transactional
public class SiteService {
    private final SiteRepository sites;
    private final UserSelectionService userSelection;
    public SiteService(SiteRepository sites, UserSelectionService userSelection) {
        this.sites = sites;
        this.userSelection = userSelection;
    }

    @Transactional(readOnly = true)
    public List<SiteRepository.SiteSummary> findAll(String search) {
        return sites.findAllSummaries(search.trim().toLowerCase());
    }

    @Transactional(readOnly = true)
    public Site findById(Long id) {
        return sites.findByIdWithUsers(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found"));
    }

    public Site create(String name, List<String> emails) {
        String value = name.trim();
        if (sites.existsByNameIgnoreCase(value)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A site with this name already exists");
        }
        return sites.save(new Site(value, findUsers(emails, null)));
    }

    public Site update(Long id, String name, List<String> emails) {
        Site site = findById(id);
        String value = name.trim();
        if (sites.existsByNameIgnoreCaseAndIdNot(value, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A site with this name already exists");
        }
        site.update(value, findUsers(emails, id));
        return site;
    }

    public void delete(Long id) {
        Site site = sites.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found"));
        sites.delete(site);
    }

    private Set<User> findUsers(List<String> emails, Long currentId) {
        Set<User> found = userSelection.findExistingByEmails(emails);
        boolean assignedElsewhere = found.stream().anyMatch(user -> user.getSite() != null
                && !user.getSite().getId().equals(currentId));
        if (assignedElsewhere) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Each user can belong to only one site");
        }
        return Set.copyOf(found);
    }
}

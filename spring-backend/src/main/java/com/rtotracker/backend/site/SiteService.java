package com.rtotracker.backend.site;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;


@Service
@Transactional
public class SiteService {
    private final SiteRepository sites;
    public SiteService(SiteRepository sites) {
        this.sites = sites;
    }

    @Transactional(readOnly = true)
    public List<SiteRepository.SiteSummary> findAll(String search) {
        return sites.findAllSummaries(search.trim().toLowerCase());
    }

    public Site create(String name) {
        String value = name.trim();
        if (sites.existsByNameIgnoreCase(value)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A site with this name already exists");
        }
        return sites.save(new Site(value));
    }

    public Site update(Long id, String name) {
        Site site = sites.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found"));
        String value = name.trim();
        if (sites.existsByNameIgnoreCaseAndIdNot(value, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A site with this name already exists");
        }
        site.updateName(value);
        return site;
    }

    public void delete(Long id) {
        Site site = sites.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found"));
        sites.delete(site);
    }

}

package com.rtotracker.backend.settings;

import org.jspecify.annotations.Nullable;

public enum SchedulingMode {
    FLEXIBLE,
    PEZA;

    public @Nullable Long dailyCapacity(long members) {
        return this == PEZA ? members / 2 + members % 2 : null;
    }
}

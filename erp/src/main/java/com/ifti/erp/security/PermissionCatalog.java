package com.ifti.erp.security;

import java.util.LinkedHashSet;
import java.util.Set;

public final class PermissionCatalog {
    private PermissionCatalog() {}
    public static final Set<String> MODULES = Set.of("PRODUCTS", "INVENTORY", "CATEGORIES", "CUSTOMERS", "SUPPLIERS", "SALES", "RETURNS", "PURCHASES", "PAYMENTS", "EXPENSES", "ACCOUNTS", "REPORTS", "STATEMENTS", "SETTINGS");
    public static final Set<String> READ_ONLY_MODULES = Set.of("REPORTS", "STATEMENTS");
    public static final Set<String> ALL;
    static {
        Set<String> permissions = new LinkedHashSet<>();
        MODULES.forEach(module -> {
            permissions.add(module + "_VIEW");
            if (!READ_ONLY_MODULES.contains(module)) permissions.add(module + "_MANAGE");
        });
        ALL = Set.copyOf(permissions);
    }
}

package com.rtotracker.backend.dashboard;

import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.io.ByteArrayInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class RtoDashboardExcelExporterTest {
    private static final LocalDate MONDAY = LocalDate.of(2026, 10, 26);
    @TempDir Path directory;

    static RtoDashboardService.WeeklyRtoReport report(boolean empty) {
        var platform = new RtoDashboardService.GroupAttendance(1L, "Team *", 999, 999, List.of());
        var unassigned = new RtoDashboardService.GroupAttendance(null, "No platform", 999, 999, List.of());
        var namedLikeUnassigned = new RtoDashboardService.GroupAttendance(2L, "No platform", 999, 999, List.of());
        var schedule = new RtoDashboardService.GroupAttendance(1L, "Regular", 999, 999, List.of());
        var noSchedule = new RtoDashboardService.GroupAttendance(null, "No work schedule", 999, 999, List.of());
        // Deliberately incorrect aggregate values: exported figures must calculate from raw records.
        var summary = new RtoDashboardService.WeeklyRtoSummary(MONDAY, MONDAY.plusDays(4), 999, 999, List.of(),
                empty ? List.of() : List.of(platform, unassigned, namedLikeUnassigned),
                empty ? List.of() : List.of(schedule, noSchedule));
        return new RtoDashboardService.WeeklyRtoReport(summary, "All Sites", empty ? List.of() : List.of(
                new RtoDashboardService.AttendanceRecord(MONDAY, "alice@example.com", "North", 1L, "Team *", 1L, "Regular"),
                new RtoDashboardService.AttendanceRecord(MONDAY.plusDays(1), "alice@example.com", "North", 1L, "Team *", 1L, "Regular"),
                new RtoDashboardService.AttendanceRecord(MONDAY, "bob@example.com", null, null, "No platform", null, "No work schedule"),
                new RtoDashboardService.AttendanceRecord(MONDAY, "carol@example.com", "=1+1", 2L, "No platform", 1L, "Regular")));
    }

    @Test
    void exportsLinkedFormulasAndRecalculatesWhenRawDataChanges() throws Exception {
        byte[] bytes = new RtoDashboardExcelExporter().export(report(false));
        Files.write(directory.resolve("rto-dashboard.xlsx"), bytes);
        try (var workbook = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            assertEquals(List.of("Summary", "Platform Breakdown", "Work Schedule Breakdown", "Raw Data"),
                    java.util.stream.IntStream.range(0, workbook.getNumberOfSheets()).mapToObj(workbook::getSheetName).toList());
            var summary = workbook.getSheet("Summary");
            assertEquals(4, summary.getRow(3).getCell(1).getNumericCellValue());
            assertEquals(3, summary.getRow(4).getCell(1).getNumericCellValue());
            assertEquals(3, summary.getRow(6).getCell(1).getNumericCellValue());
            assertEquals(CellType.FORMULA, summary.getRow(3).getCell(1).getCellType());
            var platforms = workbook.getSheet("Platform Breakdown");
            assertEquals(2, platforms.getRow(6).getCell(6).getNumericCellValue());
            assertEquals(1, platforms.getRow(6).getCell(7).getNumericCellValue());
            assertEquals(1, platforms.getRow(7).getCell(6).getNumericCellValue());
            assertEquals(1, platforms.getRow(8).getCell(6).getNumericCellValue());
            assertEquals(4, platforms.getRow(9).getCell(6).getNumericCellValue());
            var schedules = workbook.getSheet("Work Schedule Breakdown");
            assertEquals(3, schedules.getRow(6).getCell(6).getNumericCellValue());
            assertEquals(2, schedules.getRow(6).getCell(7).getNumericCellValue());
            var raw = workbook.getSheet("Raw Data");
            assertEquals(CellType.STRING, raw.getRow(9).getCell(2).getCellType());
            assertEquals("=1+1", raw.getRow(9).getCell(2).getStringCellValue());
            assertEquals("OfficePlans", raw.getTables().getFirst().getName());
            assertTrue(raw.getTables().getFirst().getCTTable().getTableColumns().getTableColumnArray(5).isSetCalculatedColumnFormula());
            raw.getRow(6).getCell(0).setCellValue(MONDAY.plusDays(2));
            raw.getRow(7).getCell(1).setCellValue("dave@example.com");
            workbook.getCreationHelper().createFormulaEvaluator().evaluateAll();
            assertEquals(2, summary.getRow(6).getCell(1).getNumericCellValue());
            assertEquals(1, summary.getRow(8).getCell(1).getNumericCellValue());
            assertEquals(4, summary.getRow(4).getCell(1).getNumericCellValue());
            assertEquals(2, platforms.getRow(6).getCell(7).getNumericCellValue());
            // A changed assignment moves the record to the corresponding existing breakdown group.
            raw.getRow(6).getCell(3).setCellValue("No platform");
            workbook.getCreationHelper().createFormulaEvaluator().evaluateAll();
            assertEquals(1, platforms.getRow(6).getCell(6).getNumericCellValue());
            assertEquals(2, platforms.getRow(8).getCell(6).getNumericCellValue());
        }
    }

    @Test
    void siteDropdownFiltersEveryReportAndResetsToAllExportedSites() throws Exception {
        try (var workbook = new XSSFWorkbook(new ByteArrayInputStream(new RtoDashboardExcelExporter().export(report(false))))) {
            var summary = workbook.getSheet("Summary");
            var platforms = workbook.getSheet("Platform Breakdown");
            var schedules = workbook.getSheet("Work Schedule Breakdown");
            assertEquals("All exported Sites", summary.getRow(3).getCell(4).getStringCellValue());
            assertEquals("ExportSiteOptions", summary.getDataValidations().getFirst().getValidationConstraint().getFormula1());
            assertEquals("E4", summary.getDataValidations().getFirst().getRegions().getCellRangeAddresses()[0].formatAsString());
            assertTrue(summary.isColumnHidden(9));
            assertNotNull(workbook.getName("ExportSiteOptions"));

            selectSite(workbook, "North");
            assertEquals(2, summary.getRow(3).getCell(1).getNumericCellValue());
            assertEquals(1, summary.getRow(4).getCell(1).getNumericCellValue());
            assertEquals(1, summary.getRow(6).getCell(1).getNumericCellValue());
            assertEquals(1, summary.getRow(7).getCell(1).getNumericCellValue());
            assertEquals(2, platforms.getRow(9).getCell(6).getNumericCellValue());
            assertEquals(1, platforms.getRow(9).getCell(7).getNumericCellValue());
            assertEquals(2, schedules.getRow(8).getCell(6).getNumericCellValue());
            assertEquals(1, schedules.getRow(8).getCell(7).getNumericCellValue());
            assertEquals("North", platforms.getRow(3).getCell(1).getStringCellValue());
            assertEquals("North", schedules.getRow(3).getCell(1).getStringCellValue());

            selectSite(workbook, "Unassigned Site");
            assertEquals(1, summary.getRow(3).getCell(1).getNumericCellValue());
            assertEquals(1, summary.getRow(4).getCell(1).getNumericCellValue());
            assertEquals(1, platforms.getRow(7).getCell(6).getNumericCellValue());
            assertEquals(1, schedules.getRow(7).getCell(6).getNumericCellValue());

            selectSite(workbook, "=1+1");
            assertEquals(1, summary.getRow(3).getCell(1).getNumericCellValue());
            assertEquals(1, platforms.getRow(8).getCell(6).getNumericCellValue());
            // The selected user's first overall row belongs to another Site; count their first selected row instead.
            workbook.getSheet("Raw Data").getRow(7).getCell(2).setCellValue("=1+1");
            selectSite(workbook, "=1+1");
            assertEquals(2, summary.getRow(3).getCell(1).getNumericCellValue());
            assertEquals(2, summary.getRow(4).getCell(1).getNumericCellValue());
            assertEquals(1, platforms.getRow(6).getCell(7).getNumericCellValue());
            assertEquals(2, schedules.getRow(6).getCell(7).getNumericCellValue());

            selectSite(workbook, "All exported Sites");
            assertEquals(4, summary.getRow(3).getCell(1).getNumericCellValue());
            assertEquals(3, summary.getRow(4).getCell(1).getNumericCellValue());
            assertEquals(4, platforms.getRow(9).getCell(6).getNumericCellValue());
            assertEquals(4, schedules.getRow(8).getCell(6).getNumericCellValue());
            assertEquals(9, workbook.getSheet("Raw Data").getLastRowNum());
        }
    }

    private static void selectSite(XSSFWorkbook workbook, String site) {
        workbook.getSheet("Summary").getRow(3).getCell(4).setCellValue(site);
        workbook.getCreationHelper().createFormulaEvaluator().evaluateAll();
    }

    @ParameterizedTest
    @ValueSource(strings = {"All exported Sites", "Unassigned Site"})
    void realSiteNamesMatchingFilterLabelsRemainIndependentlySelectable(String siteName) throws Exception {
        var original = report(false);
        var records = original.records().stream().map(record -> new RtoDashboardService.AttendanceRecord(
                record.date(), record.email(), "North".equals(record.site()) ? siteName : record.site(),
                record.platformId(), record.platform(), record.workScheduleId(), record.workSchedule())).toList();
        var report = new RtoDashboardService.WeeklyRtoReport(original.summary(), "All Sites", records);
        try (var workbook = new XSSFWorkbook(new ByteArrayInputStream(new RtoDashboardExcelExporter().export(report)))) {
            var summary = workbook.getSheet("Summary");
            assertEquals(4, summary.getRow(3).getCell(1).getNumericCellValue());
            selectSite(workbook, siteName);
            assertEquals(2, summary.getRow(3).getCell(1).getNumericCellValue());
            assertEquals(1, summary.getRow(4).getCell(1).getNumericCellValue());
            selectSite(workbook, siteName.equals("Unassigned Site") ? "Unassigned Site (filter option)" : "Unassigned Site");
            assertEquals(1, summary.getRow(3).getCell(1).getNumericCellValue());
            selectSite(workbook, siteName.equals("All exported Sites") ? "All exported Sites (filter option)" : "All exported Sites");
            assertEquals(4, summary.getRow(3).getCell(1).getNumericCellValue());
        }
    }

    @Test
    void singleSiteExportsSelectOnlyThatSiteAndKeepReportTotals() throws Exception {
        var original = report(false);
        var records = original.records().stream().filter(record -> "North".equals(record.site())).toList();
        // Applies even when All Sites was selected in the app but only one Site has data.
        var singleSite = new RtoDashboardService.WeeklyRtoReport(original.summary(), "All Sites", records);
        try (var workbook = new XSSFWorkbook(new ByteArrayInputStream(new RtoDashboardExcelExporter().export(singleSite)))) {
            var summary = workbook.getSheet("Summary");
            assertEquals("North", summary.getRow(3).getCell(4).getStringCellValue());
            assertEquals("North", summary.getRow(0).getCell(9).getStringCellValue());
            assertEquals("'Summary'!$J$1:$J$1", workbook.getName("ExportSiteOptions").getRefersToFormula());
            assertEquals(2, summary.getRow(3).getCell(1).getNumericCellValue());
            assertEquals(1, summary.getRow(4).getCell(1).getNumericCellValue());
            assertEquals(2, workbook.getSheet("Platform Breakdown").getRow(9).getCell(6).getNumericCellValue());
            assertEquals(2, workbook.getSheet("Work Schedule Breakdown").getRow(8).getCell(6).getNumericCellValue());
        }
    }

    @Test
    void unassignedOnlyExportsSelectUnassignedAndKeepReportTotals() throws Exception {
        var original = report(false);
        var records = original.records().stream().filter(record -> record.site() == null).toList();
        var unassigned = new RtoDashboardService.WeeklyRtoReport(original.summary(), "All Sites", records);
        try (var workbook = new XSSFWorkbook(new ByteArrayInputStream(new RtoDashboardExcelExporter().export(unassigned)))) {
            var summary = workbook.getSheet("Summary");
            assertEquals("Unassigned Site", summary.getRow(3).getCell(4).getStringCellValue());
            assertEquals("'Summary'!$J$1:$J$1", workbook.getName("ExportSiteOptions").getRefersToFormula());
            assertEquals(1, summary.getRow(3).getCell(1).getNumericCellValue());
        }
    }

    @Test
    void emptyExportsAreValidWorkbooksWithZeroTotals() throws Exception {
        try (var workbook = new XSSFWorkbook(new ByteArrayInputStream(new RtoDashboardExcelExporter().export(report(true))))) {
            assertEquals(0, workbook.getSheet("Summary").getRow(3).getCell(1).getNumericCellValue());
            assertEquals(0, workbook.getSheet("Summary").getRow(4).getCell(1).getNumericCellValue());
            assertEquals(0, workbook.getSheet("Platform Breakdown").getRow(6).getCell(6).getNumericCellValue());
            assertEquals(1, workbook.getSheet("Raw Data").getTables().size());
            assertEquals("'Summary'!$J$1:$J$1", workbook.getName("ExportSiteOptions").getRefersToFormula());
        }
    }
}

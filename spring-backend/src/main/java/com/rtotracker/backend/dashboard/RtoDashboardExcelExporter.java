package com.rtotracker.backend.dashboard;

import org.apache.poi.ss.SpreadsheetVersion;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataValidation;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.util.AreaReference;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFTable;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;
import org.jspecify.annotations.NonNull;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.TreeSet;

@Component
public class RtoDashboardExcelExporter {
    private static final int HEADER = 5;
    private static final String TABLE = "OfficePlans";
    private static final String SITE_SELECTOR = "'Summary'!$E$4";
    private static final String ALL_SITES = "All exported Sites";
    private static final String UNASSIGNED_SITE = "Unassigned Site";

    public byte[] export(RtoDashboardService.WeeklyRtoReport report) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Styles styles = new Styles(workbook);
            XSSFSheet summary = sheet(workbook, "Summary", report, styles);
            XSSFSheet platforms = sheet(workbook, "Platform Breakdown", report, styles);
            XSSFSheet schedules = sheet(workbook, "Work Schedule Breakdown", report, styles);
            XSSFSheet raw = sheet(workbook, "Raw Data", report, styles);
            rawData(raw, report, styles);
            summary(summary, report, styles);
            breakdown(platforms, report.summary().byPlatform(), report, true, styles);
            breakdown(schedules, report.summary().byWorkSchedule(), report, false, styles);
            siteFilter(summary, report, styles);
            workbook.getCreationHelper().createFormulaEvaluator().evaluateAll();
            workbook.setForceFormulaRecalculation(true);
            workbook.write(output);
            return output.toByteArray();
        }
    }

    private static XSSFSheet sheet(XSSFWorkbook workbook, String name,
                                   RtoDashboardService.WeeklyRtoReport report, Styles styles) {
        XSSFSheet sheet = workbook.createSheet(name);
        text(sheet.createRow(0), 0, "RTO Tracker | " + name, styles.title);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 7));
        text(sheet.createRow(1), 0, report.summary().weekStart() + " to " + report.summary().weekEnd()
                + " | Export scope: " + report.siteName(), styles.note);
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 7));
        sheet.createFreezePane(1, HEADER + 1);
        sheet.setDisplayGridlines(false);
        sheet.setDefaultColumnWidth(17);
        sheet.setColumnWidth(0, 32 * 256);
        sheet.getPrintSetup().setLandscape(true);
        sheet.setFitToPage(true);
        sheet.getPrintSetup().setFitWidth((short) 1);
        sheet.getPrintSetup().setFitHeight((short) 0);
        return sheet;
    }

    private static void rawData(XSSFSheet sheet, RtoDashboardService.WeeklyRtoReport report, Styles styles) {
        String allSites = filterOptionLabel(report, ALL_SITES);
        String unassignedSite = filterOptionLabel(report, UNASSIGNED_SITE);
        text(sheet.createRow(2), 0, "One row per saved office day. Assignments reflect current user membership.", styles.note);
        text(sheet.createRow(3), 0, "Blank assignments mean unassigned. The Summary Site selector filters reports, not these source rows.", styles.note);
        header(sheet, styles, "Date", "Email", "Site", "Platform", "Work Schedule",
                "Unique attendee", "Unique platform attendee", "Unique schedule attendee", "Included");
        int count = Math.max(1, report.records().size());
        for (int index = 0; index < count; index++) {
            Row row = sheet.createRow(HEADER + 1 + index);
            for (int column = 0; column < 9; column++) row.createCell(column).setCellStyle(styles.body);
            if (index < report.records().size()) {
                var record = Objects.requireNonNull(report.records().get(index));
                date(row, 0, record.date(), styles);
                row.getCell(1).setCellValue(record.email());
                row.getCell(2).setCellValue(record.site());
                row.getCell(3).setCellValue(record.platformId() == null ? "" : record.platform());
                row.getCell(4).setCellValue(record.workScheduleId() == null ? "" : record.workSchedule());
            }
            int excelRow = row.getRowNum() + 1;
            String included = "IF(B" + excelRow + "=\"\",0,IF(" + SITE_SELECTOR + "=\"" + allSites
                    + "\",1,IF(" + SITE_SELECTOR + "=\"" + unassignedSite + "\",IF(C" + excelRow
                    + "=\"\",1,0),IF(C" + excelRow + "=" + SITE_SELECTOR + ",1,0))))";
            formula(row, 8, included, styles.body);
            String email = criteria("B" + excelRow);
            String selectedRows = ",$I$7:I" + excelRow + ",1";
            String base = "COUNTIFS($B$7:B" + excelRow + "," + email + selectedRows + ")";
            formula(row, 5, "IF(I" + excelRow + "=0,0,IF(" + base + "=1,1,0))", styles.body);
            for (int column = 3; column <= 4; column++) {
                String letter = column == 3 ? "D" : "E";
                String matching = "COUNTIFS($B$7:B" + excelRow + "," + email + ",$" + letter
                        + "$7:" + letter + excelRow + "," + criteria(letter + excelRow) + selectedRows + ")";
                formula(row, column + 3, "IF(I" + excelRow + "=0,0,IF(" + matching + "=1,1,0))", styles.body);
            }
        }
        XSSFTable table = sheet.createTable(new AreaReference("A6:I" + (HEADER + 1 + count), SpreadsheetVersion.EXCEL2007));
        table.setName(TABLE);
        table.setDisplayName(TABLE);
        table.setStyleName("TableStyleMedium2");
        for (int column = 5; column < 9; column++) {
            table.getCTTable().getTableColumns().getTableColumnArray(column).addNewCalculatedColumnFormula()
                    .setStringValue(sheet.getRow(HEADER + 1).getCell(column).getCellFormula());
        }
        table.getCTTable().addNewAutoFilter().setRef(table.getArea().formatAsString());
        sheet.setColumnWidth(0, 16 * 256);
        sheet.setColumnWidth(1, 40 * 256);
        for (int column = 2; column < 5; column++) sheet.setColumnWidth(column, 25 * 256);
        for (int column = 5; column < 9; column++) sheet.setColumnHidden(column, true);
    }

    private static void siteFilter(XSSFSheet summary, RtoDashboardService.WeeklyRtoReport report, Styles styles) {
        String allSites = filterOptionLabel(report, ALL_SITES);
        String unassignedSite = filterOptionLabel(report, UNASSIGNED_SITE);
        Set<String> options = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        for (var record : report.records()) {
            String site = record.site();
            options.add(site == null || site.isEmpty() ? unassignedSite : site);
        }
        if (options.size() != 1) options.add(allSites);
        String selectedSite = options.size() == 1 ? options.iterator().next() : allSites;
        text(summary.getRow(3), 3, "Filter by Site", styles.total);
        text(summary.getRow(3), 4, selectedSite, styles.input);
        summary.addMergedRegion(new CellRangeAddress(3, 3, 4, 7));
        text(summary.getRow(4), 3, "Applies to all report sheets. Options are limited to this export.", styles.note);
        summary.addMergedRegion(new CellRangeAddress(4, 4, 3, 7));

        // A named range avoids Excel's 255-character limit on inline validation lists.
        int rowIndex = 0;
        for (String option : options) {
            Row row = summary.getRow(rowIndex);
            if (row == null) row = summary.createRow(rowIndex);
            text(row, 9, option, styles.body);
            rowIndex++;
        }
        summary.setColumnHidden(9, true);
        var list = summary.getWorkbook().createName();
        list.setNameName("ExportSiteOptions");
        list.setRefersToFormula("'Summary'!$J$1:$J$" + rowIndex);
        var helper = summary.getDataValidationHelper();
        var validation = helper.createValidation(helper.createFormulaListConstraint("ExportSiteOptions"),
                new CellRangeAddressList(3, 3, 4, 4));
        validation.setSuppressDropDownArrow(true);
        validation.setEmptyCellAllowed(false);
        validation.setErrorStyle(DataValidation.ErrorStyle.STOP);
        validation.setShowErrorBox(true);
        validation.createErrorBox("Choose an exported Site", "Select a Site from the dropdown list.");
        validation.setShowPromptBox(true);
        validation.createPromptBox("Site filter", "Choose a Site to update the summary and both breakdowns.");
        summary.addValidationData(validation);
    }

    private static String filterOptionLabel(RtoDashboardService.WeeklyRtoReport report, String label) {
        // Keep real Site names unchanged. The suffix exceeds the 25-character Site name limit.
        return report.records().stream().anyMatch(record -> label.equalsIgnoreCase(record.site()))
                ? label + " (filter option)" : label;
    }

    private static void summary(XSSFSheet sheet, RtoDashboardService.WeeklyRtoReport report, Styles styles) {
        Row guidance = sheet.createRow(2);
        text(guidance, 0, "Figures calculate from the Raw Data table. Add records inside that table to extend the formulas.", styles.note);
        Row total = sheet.createRow(3);
        text(total, 0, "Total planned RTO days", styles.total);
        formula(total, 1, "SUM(B7:B11)", styles.total);
        Row unique = sheet.createRow(4);
        text(unique, 0, "Distinct attendees", styles.total);
        formula(unique, 1, "SUM(" + TABLE + "[Unique attendee])", styles.total);
        header(sheet, styles, "Date", "Attendees");
        for (int index = 0; index < 5; index++) {
            Row row = sheet.createRow(HEADER + 1 + index);
            date(row, 0, report.summary().weekStart().plusDays(index), styles);
            formula(row, 1, "COUNTIFS(" + TABLE + "[Date],A" + (row.getRowNum() + 1) + ","
                    + TABLE + "[Included],1)", styles.body);
        }
        text(sheet.createRow(13), 0, "Breakdowns use current assignments. New groups require a row in the matching breakdown sheet.", styles.note);
        sheet.setColumnWidth(1, 23 * 256);
    }

    private static void breakdown(XSSFSheet sheet, List<RtoDashboardService.@NonNull GroupAttendance> groups,
                                  RtoDashboardService.WeeklyRtoReport report, boolean platform, Styles styles) {
        String column = platform ? "Platform" : "Work Schedule";
        String uniqueColumn = platform ? "Unique platform attendee" : "Unique schedule attendee";
        text(sheet.createRow(2), 0, "Daily counts and distinct attendees are formulas linked to Raw Data.", styles.note);
        Row site = sheet.createRow(3);
        text(site, 0, "Selected Site (on Summary)", styles.note);
        formula(site, 1, SITE_SELECTOR, styles.input);
        sheet.addMergedRegion(new CellRangeAddress(3, 3, 1, 4));
        Row header = header(sheet, styles, column, "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Week total", "Distinct attendees");
        for (int index = 0; index < 5; index++) date(header, index + 1, report.summary().weekStart().plusDays(index), styles);
        for (int index = 0; index < groups.size(); index++) {
            var group = Objects.requireNonNull(groups.get(index));
            Row row = sheet.createRow(HEADER + 1 + index);
            int excelRow = row.getRowNum() + 1;
            text(row, 0, group.name(), styles.body);
            // Blank source values identify unassigned members, even if a real group has the same display name.
            String groupCriteria = group.id() == null ? "\"\"" : criteria("$A" + excelRow);
            for (int day = 0; day < 5; day++) {
                String dateCell = (char) ('B' + day) + "$6";
                formula(row, day + 1, "COUNTIFS(" + TABLE + "[Date]," + dateCell + ","
                        + TABLE + "[" + column + "]," + groupCriteria + "," + TABLE + "[Included],1)", styles.body);
            }
            formula(row, 6, "SUM(B" + excelRow + ":F" + excelRow + ")", styles.total);
            formula(row, 7, "SUMIFS(" + TABLE + "[" + uniqueColumn + "]," + TABLE + "[" + column + "],"
                    + groupCriteria + ")", styles.body);
        }
        Row totals = sheet.createRow(HEADER + 1 + groups.size());
        text(totals, 0, "Daily total", styles.total);
        for (int columnIndex = 1; columnIndex <= 7; columnIndex++) {
            String letter = String.valueOf((char) ('A' + columnIndex));
            formula(totals, columnIndex, groups.isEmpty() ? "0" : "SUM(" + letter + "7:" + letter + (totals.getRowNum()) + ")", styles.total);
        }
        sheet.setColumnWidth(7, 23 * 256);
    }

    // COUNTIF(S) treats * and ? as wildcards; escape them to match literal names and emails.
    private static String criteria(String cell) {
        return "IF(" + cell + "=\"\",\"\",\"=\"&SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(" + cell
                + ",\"~\",\"~~\"),\"*\",\"~*\"),\"?\",\"~?\"))";
    }

    private static Row header(XSSFSheet sheet, Styles styles, String... labels) {
        Row row = sheet.createRow(HEADER);
        row.setHeightInPoints(30);
        for (int index = 0; index < labels.length; index++) text(row, index, labels[index], styles.header);
        return row;
    }

    private static void text(Row row, int column, String value, CellStyle style) {
        Cell cell = row.createCell(column);
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    private static void formula(Row row, int column, String value, CellStyle style) {
        Cell cell = row.getCell(column, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
        cell.setCellFormula(value);
        cell.setCellStyle(style);
    }

    private static void date(Row row, int column, LocalDate value, Styles styles) {
        Cell cell = row.getCell(column, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
        cell.setCellValue(value);
        cell.setCellStyle(row.getRowNum() == HEADER ? styles.dateHeader : styles.date);
    }

    private static final class Styles {
        private final CellStyle title;
        private final CellStyle note;
        private final CellStyle header;
        private final CellStyle dateHeader;
        private final CellStyle body;
        private final CellStyle date;
        private final CellStyle total;
        private final CellStyle input;

        private Styles(XSSFWorkbook workbook) {
            title = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setFontHeightInPoints((short) 20);
            titleFont.setBold(true);
            title.setFont(titleFont);
            note = workbook.createCellStyle();
            Font noteFont = workbook.createFont();
            noteFont.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
            note.setFont(noteFont);
            body = workbook.createCellStyle();
            body.setDataFormat(workbook.createDataFormat().getFormat("0"));
            header = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            header.setFont(headerFont);
            header.setFillForegroundColor(IndexedColors.DARK_TEAL.getIndex());
            header.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            header.setWrapText(true);
            date = workbook.createCellStyle();
            date.setDataFormat(workbook.createDataFormat().getFormat("ddd, dd mmm yyyy"));
            dateHeader = workbook.createCellStyle();
            dateHeader.cloneStyleFrom(header);
            dateHeader.setDataFormat(workbook.createDataFormat().getFormat("ddd, dd mmm"));
            total = workbook.createCellStyle();
            total.cloneStyleFrom(body);
            Font totalFont = workbook.createFont();
            totalFont.setBold(true);
            total.setFont(totalFont);
            total.setFillForegroundColor(IndexedColors.LIGHT_ORANGE.getIndex());
            total.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            input = workbook.createCellStyle();
            input.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
            input.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        }
    }
}

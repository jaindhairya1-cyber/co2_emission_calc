import os
import datetime
from typing import Dict, Any, List

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
REPORTS_DIR = os.path.join(BASE_DIR, 'reports')
SPREADSHEETS_DIR = os.path.join(REPORTS_DIR, 'spreadsheets')
PDF_DIR = os.path.join(REPORTS_DIR, 'pdf')

os.makedirs(SPREADSHEETS_DIR, exist_ok=True)
os.makedirs(PDF_DIR, exist_ok=True)

# Standard emission factors (kg CO2e per unit)
FACTOR_CATALOG = {
    "electricity": {"factor": 0.710, "unit": "kg CO2e/kWh", "standard": "CEA India v21.0"},
    "diesel": {"factor": 2.687, "unit": "kg CO2e/L", "standard": "IPCC / DEFRA"},
    "petrol": {"factor": 2.314, "unit": "kg CO2e/L", "standard": "IPCC / DEFRA"},
    "lpg": {"factor": 1.512, "unit": "kg CO2e/kg", "standard": "IPCC / DEFRA"},
    "natural gas": {"factor": 1.932, "unit": "kg CO2e/m3", "standard": "IPCC / DEFRA"},
    "coal": {"factor": 2.420, "unit": "kg CO2e/kg", "standard": "IPCC / DEFRA"},
    "transport_default": {"factor": 0.220, "unit": "kg CO2e/km", "standard": "DEFRA Freight"},
    "steel": {"factor": 1.820, "unit": "kg CO2e/kg", "standard": "WorldSteel / ICE"},
    "cotton yarn": {"factor": 3.540, "unit": "kg CO2e/kg", "standard": "Textile Exchange"},
    "plastic polymers": {"factor": 2.150, "unit": "kg CO2e/kg", "standard": "PlasticsEurope"},
    "aluminum": {"factor": 8.240, "unit": "kg CO2e/kg", "standard": "IAI / ICE"},
    "chemicals": {"factor": 2.800, "unit": "kg CO2e/kg", "standard": "Ecoinvent"},
    "corrugated boxes": {"factor": 0.850, "unit": "kg CO2e/kg", "standard": "FEFCO"},
    "general waste": {"factor": 0.580, "unit": "kg CO2e/kg", "standard": "IPCC Waste"},
    "hazardous waste": {"factor": 1.850, "unit": "kg CO2e/kg", "standard": "CPCB / IPCC"},
    "recyclable plastic": {"factor": 0.220, "unit": "kg CO2e/kg", "standard": "WRAP"},
    "metal scrap": {"factor": 0.150, "unit": "kg CO2e/kg", "standard": "BIR Scrap"},
    "organic waste": {"factor": 0.450, "unit": "kg CO2e/kg", "standard": "IPCC Composting"}
}

def _get_multiplier(period: str) -> int:
    p = (period or 'Monthly').lower()
    if 'month' in p:
        return 12
    if 'quarter' in p:
        return 4
    return 1

def build_inventory_items(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Builds a dynamic list of activity inventory line items from input payload."""
    items = []

    # 1. Electricity (Scope 2)
    elec = data.get('electricity') or {}
    elec_amt = float(elec.get('amount') or 0.0)
    if elec_amt > 0:
        period = elec.get('period', 'Monthly')
        mult = _get_multiplier(period)
        annual_kwh = elec_amt * mult
        factor = FACTOR_CATALOG["electricity"]["factor"]
        emissions_t = (annual_kwh * factor) / 1000.0
        items.append({
            "domain": "Electricity",
            "scope": "Scope 2",
            "activity": f"Grid Electricity ({elec_amt:,.0f} {elec.get('unit', 'kWh')}/{period[:2].lower()})",
            "annual_qty": f"{annual_kwh:,.0f} kWh/yr",
            "standard": f"{FACTOR_CATALOG['electricity']['standard']} ({factor:.4f})",
            "emissions_t": emissions_t
        })

    # 2. Fuels (Scope 1)
    fuels = data.get('fuels') or []
    if isinstance(fuels, dict):
        fuels = [fuels]
    for f in fuels:
        qty = float(f.get('quantity') or 0.0)
        if qty <= 0:
            continue
        ftype = f.get('type') or 'Diesel'
        unit = f.get('unit') or 'Litres'
        period = f.get('period', 'Monthly')
        mult = _get_multiplier(period)
        annual_qty = qty * mult
        cat = FACTOR_CATALOG.get(ftype.lower(), FACTOR_CATALOG['diesel'])
        emissions_t = (annual_qty * cat['factor']) / 1000.0
        items.append({
            "domain": "Fuel",
            "scope": "Scope 1",
            "activity": f"{ftype} Combustion ({qty:,.0f} {unit}/{period[:2].lower()})",
            "annual_qty": f"{annual_qty:,.0f} {unit}/yr",
            "standard": f"{cat['standard']} ({cat['factor']:.4f})",
            "emissions_t": emissions_t
        })

    # 3. Transport (Scope 3)
    transport = data.get('transport') or {}
    dist = float(transport.get('distance_km') or 0.0)
    if dist > 0:
        period = transport.get('period', 'Monthly')
        vtype = transport.get('vehicle_type') or 'Fleet Vehicles'
        mult = _get_multiplier(period)
        annual_km = dist * mult
        factor = FACTOR_CATALOG["transport_default"]["factor"]
        emissions_t = (annual_km * factor) / 1000.0
        items.append({
            "domain": "Transport",
            "scope": "Scope 3",
            "activity": f"{vtype} ({dist:,.0f} km/{period[:2].lower()})",
            "annual_qty": f"{annual_km:,.0f} km/yr",
            "standard": f"{FACTOR_CATALOG['transport_default']['standard']} ({factor:.4f})",
            "emissions_t": emissions_t
        })

    # 4. Materials (Scope 3)
    materials = data.get('materials') or []
    if isinstance(materials, dict):
        materials = [materials]
    for m in materials:
        qty = float(m.get('quantity') or 0.0)
        if qty <= 0:
            continue
        mtype = m.get('type') or 'Materials'
        unit = m.get('unit') or 'kg'
        period = m.get('period', 'Monthly')
        mult = _get_multiplier(period)
        annual_qty = qty * mult
        cat = FACTOR_CATALOG.get(mtype.lower(), FACTOR_CATALOG['steel'])
        emissions_t = (annual_qty * cat['factor']) / 1000.0
        items.append({
            "domain": "Materials",
            "scope": "Scope 3",
            "activity": f"{mtype} Inflow ({qty:,.0f} {unit}/{period[:2].lower()})",
            "annual_qty": f"{annual_qty:,.0f} {unit}/yr",
            "standard": f"{cat['standard']} ({cat['factor']:.4f})",
            "emissions_t": emissions_t
        })

    # 5. Waste (Scope 3)
    waste = data.get('waste') or []
    if isinstance(waste, dict):
        waste = [waste]
    for w in waste:
        qty = float(w.get('quantity') or 0.0)
        if qty <= 0:
            continue
        wtype = w.get('type') or 'General waste'
        unit = w.get('unit') or 'kg'
        period = w.get('period', 'Monthly')
        mult = _get_multiplier(period)
        annual_qty = qty * mult
        matched_cat = FACTOR_CATALOG.get(wtype.lower())
        if not matched_cat:
            if 'organic' in wtype.lower():
                matched_cat = FACTOR_CATALOG['organic waste']
            elif 'hazard' in wtype.lower():
                matched_cat = FACTOR_CATALOG['hazardous waste']
            elif 'plastic' in wtype.lower():
                matched_cat = FACTOR_CATALOG['recyclable plastic']
            elif 'metal' in wtype.lower():
                matched_cat = FACTOR_CATALOG['metal scrap']
            else:
                matched_cat = FACTOR_CATALOG['general waste']
        emissions_t = (annual_qty * matched_cat['factor']) / 1000.0
        items.append({
            "domain": "Waste",
            "scope": "Scope 3",
            "activity": f"{wtype} ({qty:,.0f} {unit}/{period[:2].lower()})",
            "annual_qty": f"{annual_qty:,.0f} {unit}/yr",
            "standard": f"{matched_cat['standard']} ({matched_cat['factor']:.4f})",
            "emissions_t": emissions_t
        })

    return items


def generate_spreadsheet_report(data: Dict[str, Any]) -> str:
    biz = data.get('business', {})
    footprint = data.get('footprint', {})
    temp_id = data.get('tempId', 'TEMP-MSME-8492')

    items = build_inventory_items(data)

    s1 = sum(i['emissions_t'] for i in items if i['scope'] == 'Scope 1')
    s2 = sum(i['emissions_t'] for i in items if i['scope'] == 'Scope 2')
    s3 = sum(i['emissions_t'] for i in items if i['scope'] == 'Scope 3')
    calculated_total = s1 + s2 + s3

    total_emissions = footprint.get('total') if footprint.get('total') is not None else calculated_total
    scope1_emissions = footprint.get('scope1') if footprint.get('scope1') is not None else s1
    scope2_emissions = footprint.get('scope2') if footprint.get('scope2') is not None else s2
    scope3_emissions = footprint.get('scope3') if footprint.get('scope3') is not None else s3

    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    biz_name = biz.get('name') or 'MSME'
    clean_biz_name = "".join(c for c in biz_name if c.isalnum() or c in (' ', '_', '-')).replace(' ', '_')
    filename = f"TerraAI_Carbon_Report_{clean_biz_name}_{timestamp}.xlsx"
    file_path = os.path.join(SPREADSHEETS_DIR, filename)

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Carbon Ledger"

    brand_fill = PatternFill(start_color="165338", end_color="165338", fill_type="solid")
    subhead_fill = PatternFill(start_color="E2E8F0", end_color="E2E8F0", fill_type="solid")
    total_fill = PatternFill(start_color="D1FAE5", end_color="D1FAE5", fill_type="solid")

    header_font = Font(name="Arial", size=11, bold=True, color="FFFFFF")
    title_font = Font(name="Arial", size=15, bold=True, color="165338")
    bold_font = Font(name="Arial", size=10, bold=True)
    regular_font = Font(name="Arial", size=10)
    meta_label_font = Font(name="Arial", size=10, bold=True, color="475569")

    thin_border = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1')
    )

    ws.merge_cells("A1:F1")
    ws["A1"] = f"TerraAI — MSME Carbon Audit & GHG Ledger"
    ws["A1"].font = title_font
    ws["A1"].alignment = Alignment(vertical="center")

    meta = [
        ("Facility / Company:", biz.get('name', 'ABC Textiles'), "Reporting Period:", biz.get('reportingPeriod', 'FY 2025-26')),
        ("Industry Sector:", biz.get('industry', 'Manufacturing'), "Audit / Session ID:", temp_id),
        ("Location:", biz.get('city', 'India'), "Audited Date:", datetime.datetime.now().strftime('%d %B %Y')),
        ("Authorized Officer:", biz.get('ownerName', 'MSME Officer'), "Contact Email:", biz.get('email', 'contact@msme.in'))
    ]

    curr_row = 3
    for m in meta:
        ws.cell(row=curr_row, column=1, value=m[0]).font = meta_label_font
        ws.cell(row=curr_row, column=2, value=m[1]).font = regular_font
        ws.cell(row=curr_row, column=4, value=m[2]).font = meta_label_font
        ws.cell(row=curr_row, column=5, value=m[3]).font = regular_font
        curr_row += 1

    curr_row += 1
    ws.cell(row=curr_row, column=1, value="SCOPE SUMMARY").font = bold_font
    curr_row += 1
    
    scope_headers = ["Scope", "Classification", "Standard Boundary", "Emissions (tCO2e)", "Share (%)"]
    for col_idx, h in enumerate(scope_headers, 1):
        cell = ws.cell(row=curr_row, column=col_idx, value=h)
        cell.fill = subhead_fill
        cell.font = bold_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = thin_border
    curr_row += 1

    total_val = float(total_emissions or 0.0)
    def calc_pct(v):
        return f"{(v / total_val * 100):.1f}%" if total_val > 0 else "0.0%"

    scope_rows = [
        ["Scope 1", "Direct Fuels & Stationary Combustion", "IPCC / GHG Protocol", float(scope1_emissions or 0.0), calc_pct(float(scope1_emissions or 0.0))],
        ["Scope 2", "Purchased Grid Electricity", "CEA India CO2 Baseline v21.0", float(scope2_emissions or 0.0), calc_pct(float(scope2_emissions or 0.0))],
        ["Scope 3", "Value Chain (Transport, Materials, Waste)", "GHG Protocol Corporate Value Chain", float(scope3_emissions or 0.0), calc_pct(float(scope3_emissions or 0.0))],
        ["NET TOTAL", "Aggregated Facility Greenhouse Gas Footprint", "ISO 14064 / BRSR Core", total_val, "100.0%"]
    ]

    for s_idx, s_data in enumerate(scope_rows):
        is_total = (s_idx == len(scope_rows) - 1)
        for c_idx, val in enumerate(s_data, 1):
            cell = ws.cell(row=curr_row, column=c_idx, value=val)
            cell.font = bold_font if is_total else regular_font
            cell.border = thin_border
            if is_total:
                cell.fill = total_fill
            if c_idx == 4 and isinstance(val, (int, float)):
                cell.number_format = '0.00'
                cell.alignment = Alignment(horizontal="right")
            elif c_idx == 5:
                cell.alignment = Alignment(horizontal="center")
        curr_row += 1

    curr_row += 2
    ws.cell(row=curr_row, column=1, value="DETAILED ACTIVITY INVENTORY & EMISSION SOURCES").font = bold_font
    curr_row += 1

    headers = ["Domain", "Scope", "Activity Input", "Annual Activity Qty", "Statutory Factor & Reference", "Emissions (tCO2e)"]
    for col_idx, h in enumerate(headers, 1):
        cell = ws.cell(row=curr_row, column=col_idx, value=h)
        cell.fill = brand_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = thin_border
    curr_row += 1

    if not items:
        items = [{
            "domain": "Facility",
            "scope": "All",
            "activity": "Operational assessment baseline",
            "annual_qty": "1 unit",
            "standard": "Estimated baseline",
            "emissions_t": total_val
        }]

    for item in items:
        r_vals = [
            item["domain"],
            item["scope"],
            item["activity"],
            item["annual_qty"],
            item["standard"],
            round(item["emissions_t"], 2)
        ]
        for c_idx, val in enumerate(r_vals, 1):
            cell = ws.cell(row=curr_row, column=c_idx, value=val)
            cell.font = regular_font
            cell.border = thin_border
            if c_idx == 6:
                cell.number_format = '0.00'
                cell.alignment = Alignment(horizontal="right")
            elif c_idx in (1, 2):
                cell.alignment = Alignment(horizontal="center")
        curr_row += 1

    summary_vals = ["TOTAL", "Net", "Aggregated Facility Activities", "Annual Sum", "Verified MSME Standard", round(total_val, 2)]
    for c_idx, val in enumerate(summary_vals, 1):
        cell = ws.cell(row=curr_row, column=c_idx, value=val)
        cell.font = bold_font
        cell.fill = total_fill
        cell.border = thin_border
        if c_idx == 6:
            cell.number_format = '0.00'
            cell.alignment = Alignment(horizontal="right")
        elif c_idx in (1, 2):
            cell.alignment = Alignment(horizontal="center")

    from openpyxl.utils import get_column_letter
    for col_idx, col in enumerate(ws.columns, 1):
        max_len = 0
        for cell in col:
            v_str = str(cell.value or '')
            if len(v_str) > max_len and '\n' not in v_str and cell.row > 1:
                max_len = len(v_str)
        col_letter = get_column_letter(col_idx)
        ws.column_dimensions[col_letter].width = max(max_len + 3, 14)

    wb.save(file_path)
    return filename


def generate_pdf_report(data: Dict[str, Any]) -> str:
    biz = data.get('business', {})
    footprint = data.get('footprint', {})
    temp_id = data.get('tempId', 'TEMP-MSME-8492')

    items = build_inventory_items(data)

    s1 = sum(i['emissions_t'] for i in items if i['scope'] == 'Scope 1')
    s2 = sum(i['emissions_t'] for i in items if i['scope'] == 'Scope 2')
    s3 = sum(i['emissions_t'] for i in items if i['scope'] == 'Scope 3')
    calculated_total = s1 + s2 + s3

    total_emissions = float(footprint.get('total') if footprint.get('total') is not None else calculated_total)
    scope1_emissions = float(footprint.get('scope1') if footprint.get('scope1') is not None else s1)
    scope2_emissions = float(footprint.get('scope2') if footprint.get('scope2') is not None else s2)
    scope3_emissions = float(footprint.get('scope3') if footprint.get('scope3') is not None else s3)

    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    biz_name = biz.get('name') or 'MSME'
    clean_biz_name = "".join(c for c in biz_name if c.isalnum() or c in (' ', '_', '-')).replace(' ', '_')
    filename = f"TerraAI_Carbon_Audit_{clean_biz_name}_{timestamp}.pdf"
    file_path = os.path.join(PDF_DIR, filename)

    doc = SimpleDocTemplate(file_path, pagesize=A4, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        textColor=colors.HexColor('#165338'),
        spaceAfter=6
    )
    
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=colors.HexColor('#165338'),
        spaceBefore=12,
        spaceAfter=6
    )

    cell_style = ParagraphStyle(
        'CellText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10
    )

    cell_bold = ParagraphStyle(
        'CellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10
    )

    story.append(Paragraph("TerraAI — Carbon Accounting & GHG Audit Report", title_style))
    story.append(Paragraph(
        f"<b>Facility Name:</b> {biz.get('name', 'ABC Textiles')} | <b>Reporting Period:</b> {biz.get('reportingPeriod', 'FY 2025-26')}<br/>"
        f"<b>Industry:</b> {biz.get('industry', 'Manufacturing')} | <b>Location:</b> {biz.get('city', 'India')}<br/>"
        f"<b>Session / Audit ID:</b> {temp_id} | <b>Audit Date:</b> {datetime.datetime.now().strftime('%d %B %Y')}",
        styles['Normal']
    ))
    story.append(Spacer(1, 14))

    story.append(Paragraph("Executive Scope Summary", section_style))
    
    def calc_share(v):
        return f"{(v / total_emissions * 100):.1f}%" if total_emissions > 0 else "0.0%"

    summary_table_data = [
        ["Emissions Scope", "Primary Sources", "Statutory Standard", "Emissions (tCO2e)", "Share"],
        ["Scope 1 Direct", "Diesel, Petrol, Boilers, Stationary Fuels", "IPCC DEFRA", f"{scope1_emissions:.2f}", calc_share(scope1_emissions)],
        ["Scope 2 Indirect", "Purchased Grid Electricity", "CEA India Baseline v21.0", f"{scope2_emissions:.2f}", calc_share(scope2_emissions)],
        ["Scope 3 Value Chain", "Supply Logistics, Materials, Waste", "GHG Protocol MSME", f"{scope3_emissions:.2f}", calc_share(scope3_emissions)],
        ["NET FOOTPRINT", "Aggregated Facility Operations", "SEBI BRSR Core / ISO 14064", f"{total_emissions:.2f}", "100.0%"]
    ]

    t_summary = Table(summary_table_data, colWidths=[110, 150, 130, 85, 48])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#165338')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (3, 0), (4, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#DCFCE7')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
    ]))
    story.append(t_summary)
    story.append(Spacer(1, 14))

    story.append(Paragraph("Itemized Activity Ledger & Emission Sources", section_style))

    if not items:
        items = [{
            "domain": "Facility",
            "scope": "All",
            "activity": "Operational assessment baseline",
            "annual_qty": "1 unit",
            "standard": "Estimated baseline",
            "emissions_t": total_emissions
        }]

    item_table_data = [
        ["Domain", "Scope", "Activity & Consumptions", "Annual Quantity", "Factor Standard", "tCO2e"]
    ]

    for itm in items:
        item_table_data.append([
            Paragraph(itm["domain"], cell_style),
            Paragraph(itm["scope"], cell_style),
            Paragraph(itm["activity"], cell_style),
            Paragraph(itm["annual_qty"], cell_style),
            Paragraph(itm["standard"], cell_style),
            f"{itm['emissions_t']:.2f}"
        ])

    item_table_data.append([
        Paragraph("TOTAL", cell_bold),
        Paragraph("Net", cell_bold),
        Paragraph("All Reported Activity Inputs", cell_bold),
        "-",
        "-",
        f"{total_emissions:.2f}"
    ])

    t_items = Table(item_table_data, colWidths=[65, 55, 155, 95, 110, 43])
    t_items.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (5, 0), (5, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#F1F5F9')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
    ]))
    story.append(t_items)

    story.append(Spacer(1, 18))
    story.append(Paragraph(
        "<b>Statutory Disclosure & Compliance Note:</b> This audit report is generated according to the Central Electricity Authority (CEA) India CO₂ Baseline Database v21.0, Ministry of Power, and aligns with SEBI BRSR Core MSME Environmental indicators (Scope 1, Scope 2, and initial Scope 3 disclosures).",
        styles['Italic']
    ))

    doc.build(story)
    return filename

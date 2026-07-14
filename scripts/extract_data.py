import os
import sys
import math
import re
import pandas as pd
import json

# Reconfigure stdout to use UTF-8
sys.stdout.reconfigure(encoding='utf-8')

# Coordinates Conversion: UTM Zone 15N to Latitude/Longitude (WGS84)
def utm_to_latlon(easting, northing, zone=15, northernHemisphere=True):
    if pd.isna(easting) or pd.isna(northing):
        return None, None
    try:
        easting = float(easting)
        northing = float(northing)
    except:
        return None, None
        
    a = 6378137
    f = 1 / 298.257223563
    b = a * (1 - f)
    e = math.sqrt(1 - (b / a) ** 2)
    
    k0 = 0.9996
    
    x = easting - 500000
    y = northing if northernHemisphere else northing - 10000000
    
    lon0 = ((zone - 1) * 6 - 180 + 3) * math.pi / 180
    
    eccPrimeSquared = (e * e) / (1 - e * e)
    
    M = y / k0
    mu = M / (a * (1 - e**2/4 - 3*e**4/64 - 5*e**6/256))
    
    e1 = (1 - math.sqrt(1 - e**2)) / (1 + math.sqrt(1 - e**2))
    
    phi1Rad = (mu + (3 * e1 / 2 - 27 * e1**3 / 32) * math.sin(2 * mu)
               + (21 * e1**2 / 16 - 55 * e1**4 / 32) * math.sin(4 * mu)
               + (151 * e1**3 / 96) * math.sin(6 * mu))
    
    N1 = a / math.sqrt(1 - e**2 * math.sin(phi1Rad)**2)
    T1 = math.tan(phi1Rad)**2
    C1 = eccPrimeSquared * math.cos(phi1Rad)**2
    R1 = a * (1 - e**2) / (1 - e**2 * math.sin(phi1Rad)**2)**1.5
    D = x / (N1 * k0)
    
    lat = phi1Rad - (N1 * math.tan(phi1Rad) / R1) * (
        D**2/2 - (5 + 3*T1 + 10*C1 - 4*C1**2 - 9*eccPrimeSquared)*D**4/24
        + (61 + 90*T1 + 298*C1 + 45*T1**2 - 252*eccPrimeSquared - 3*C1**2)*D**6/720
    )
    
    lon = lon0 + (D - (1 + 2*T1 + C1)*D**3/6 + (5 - 2*C1 + 28*T1 - 3*T1**2 + 8*C1**2 + 24*eccPrimeSquared)*D**5/120) / math.cos(phi1Rad)
    
    return math.degrees(lat), math.degrees(lon)

# Normalize well name to match across sheets (stripping leading zeros)
def clean_well_name(name):
    if pd.isna(name):
        return ""
    name = str(name).strip()
    name = re.sub(r'\s+', ' ', name)
    name = re.sub(r'\s*-\s*', '-', name)
    
    # Translate prefix
    if name.upper().startswith("B-"):
        name = "Balam-" + name[2:]
    elif name.upper().startswith("EK-"):
        name = "Ek-" + name[3:]
        
    # Standard format match: Balam-XX or Ek-XX
    match = re.match(r'^(Balam|Ek)-\d+', name, re.IGNORECASE)
    if match:
        prefix = match.group(1).capitalize()
        # Convertir a entero para eliminar ceros a la izquierda (ej. Ek-05 -> Ek-5)
        number = str(int(re.search(r'\d+', match.group(0)).group()))
        return f"{prefix}-{number}"
    
    return name

# Format date to YYYY-MM-DD
def clean_date(d):
    if pd.isna(d):
        return None
    if isinstance(d, pd.Timestamp) or hasattr(d, 'strftime'):
        return d.strftime('%Y-%m-%d')
    # Try parsing
    try:
        dt = pd.to_datetime(d)
        if not pd.isna(dt):
            return dt.strftime('%Y-%m-%d')
    except:
        pass
    
    # Check if integer year
    try:
        year = int(float(d))
        if 1900 <= year <= 2100:
            return f"{year}-01-01"
    except:
        pass
        
    return str(d)

def clean_float(val):
    if pd.isna(val):
        return None
    try:
        return float(str(val).replace(',', '').strip())
    except:
        return None

# MAIN PIPELINE
def main():
    excel_path = r"d:\3_Trabajo\65_Sierra Madre\1_Ek-Balam\17_Actuliación Cuarto de Datos\Ek-Balam Viewer\EkBalam_DataRoom_DBCapture.26.06.20.xlsx"
    if not os.path.exists(excel_path):
        print(f"Error: Excel file not found at {excel_path}")
        sys.exit(1)
        
    print("Loading Excel file...")
    xl = pd.ExcelFile(excel_path)
    
    # 1. Parse Well Status
    print("Parsing Well Status...")
    df_status = xl.parse("Well Status")
    # Clean columns
    df_status.columns = [c.strip() for c in df_status.columns]
    # Forward fill platform and equipment
    df_status['Platform'] = df_status['Platform'].ffill().str.strip()
    df_status['Equipment'] = df_status['Equipment'].ffill().str.strip()
    
    wells_dict = {}
    for idx, row in df_status.iterrows():
        raw_well = row['Well']
        if pd.isna(raw_well):
            continue
        well_name = clean_well_name(raw_well)
        if not well_name or "pozos" in well_name.lower():
            continue
            
        wells_dict[well_name] = {
            "name": well_name,
            "rawName": str(raw_well).strip(),
            "platform": str(row['Platform']).strip() if not pd.isna(row['Platform']) else "",
            "equipment": str(row['Equipment']).strip() if not pd.isna(row['Equipment']) else "",
            "field": str(row['Field']).strip() if not pd.isna(row['Field']) else "",
            "block": str(row['Block']).strip() if not pd.isna(row['Block']) else "",
            "wellType": str(row['Well Type']).strip() if not pd.isna(row['Well Type']) else "",
            "testedIntervals": str(row['Tested intervals']).strip() if not pd.isna(row['Tested intervals']) else "",
            "trajectory": str(row['Well Trajectory']).strip() if not pd.isna(row['Well Trajectory']) else "",
            "status": str(row['Current Status']).strip() if not pd.isna(row['Current Status']) else "",
            "sidetrack": str(row['Sidetrack (Y/N)']).strip() if not pd.isna(row['Sidetrack (Y/N)']) else "N",
            "sidetracksCount": int(row['Number of Sidetracks']) if not pd.isna(row['Number of Sidetracks']) and str(row['Number of Sidetracks']).isdigit() else 0,
            "reservoir": str(row['Current Producing Reservoir']).strip() if not pd.isna(row['Current Producing Reservoir']) else "",
            "espInstalled": str(row['ESP Installed (Y/N)']).strip() if not pd.isna(row['ESP Installed (Y/N)']) else "N",
            "historicalEsp": str(row['Historical ESP']).strip() if not pd.isna(row['Historical ESP']) else "",
            "comments": str(row['Commets']).strip() if not pd.isna(row['Commets']) else "",
            "plannedActivity": str(row['Planned 2026 Activity']).strip() if not pd.isna(row['Planned 2026 Activity']) else "",
            "lat": None,
            "lon": None,
            "x": None,
            "y": None,
            "z": None,
            "md": None,
            "jso_np": None
        }

    # 2. Parse Coordinates
    print("Parsing Coordinates...")
    df_coord = xl.parse("Wells Cordinate ")
    for idx, row in df_coord.iterrows():
        raw_pozo = row['Pozo']
        well_name = clean_well_name(raw_pozo)
        if not well_name or "pozos" in well_name.lower():
            continue
            
        x = clean_float(row['X'])
        y = clean_float(row['Y'])
        z = clean_float(row['Z'])
        md = clean_float(row['MD'])
        jso_np = str(row['JSO_NP']).strip() if not pd.isna(row['JSO_NP']) else ""
        
        lat, lon = utm_to_latlon(x, y, zone=15)
        
        if well_name in wells_dict:
            wells_dict[well_name].update({
                "x": x, "y": y, "z": z, "md": md, "jso_np": jso_np,
                "lat": lat, "lon": lon
            })
        else:
            # Add to dict as coordinate only well
            field = "Ek" if well_name.lower().startswith("ek") else "Balam"
            wells_dict[well_name] = {
                "name": well_name,
                "rawName": str(raw_pozo).strip(),
                "platform": "", "equipment": "", "field": field, "block": "",
                "wellType": "", "testedIntervals": "", "trajectory": "",
                "status": "Unknown", "sidetrack": "N", "sidetracksCount": 0,
                "reservoir": str(row['Cima']).strip() if not pd.isna(row['Cima']) else "",
                "espInstalled": "N", "historicalEsp": "", "comments": "Coordinates only",
                "plannedActivity": "",
                "x": x, "y": y, "z": z, "md": md, "jso_np": jso_np,
                "lat": lat, "lon": lon
            }
            
    # Calculate Platform Centroids for wells missing coordinates
    # Group known coordinates by platform
    platform_coords = {}
    for name, w in wells_dict.items():
        if w["platform"] and w["lat"] is not None and w["lon"] is not None:
            plat = w["platform"]
            if plat not in platform_coords:
                platform_coords[plat] = []
            platform_coords[plat].append((w["lat"], w["lon"]))
            
    platform_centroids = {}
    for plat, coords in platform_coords.items():
        avg_lat = sum(c[0] for c in coords) / len(coords)
        avg_lon = sum(c[1] for c in coords) / len(coords)
        platform_centroids[plat] = (avg_lat, avg_lon)
        print(f"Platform Centroid for '{plat}': Lat {avg_lat:.5f}, Lon {avg_lon:.5f} (based on {len(coords)} wells)")

    # Provide default field-level centroids in case platform is not mapped
    # Ek field is centered around Ek-A platform: 19.458 N, -92.018 W
    # Balam field is centered around Balam-TA: 19.485 N, -91.964 W
    field_centroids = {
        "Ek": (19.458, -92.018),
        "Balam": (19.485, -91.964),
        "": (19.47, -91.99)
    }

    # Fill in missing coordinates with platform centroid or field centroid + jitter
    import random
    random.seed(42) # For reproducible jitter
    
    for name, w in wells_dict.items():
        if w["lat"] is None or w["lon"] is None:
            plat = w["platform"]
            field = w["field"]
            if plat in platform_centroids:
                plat_lat, plat_lon = platform_centroids[plat]
                # Add a tiny jitter (approx 10-20 meters) so they don't overlay exactly
                w["lat"] = plat_lat + (random.random() - 0.5) * 0.0001
                w["lon"] = plat_lon + (random.random() - 0.5) * 0.0001
                w["comments"] = (w["comments"] + " [Posición aprox por plataforma]").strip()
            else:
                # Fallback to field centroid
                f_lat, f_lon = field_centroids.get(field, field_centroids[""])
                w["lat"] = f_lat + (random.random() - 0.5) * 0.005
                w["lon"] = f_lon + (random.random() - 0.5) * 0.005
                w["comments"] = (w["comments"] + " [Posición aprox por campo]").strip()

    # 3. Parse Production (Ek Production May2026 and Balam Production May2026)
    print("Parsing Production from Ek & Balam sheets...")
    production_records = []
    
    def parse_horizontal_prod_sheet(sheet_name, field_name):
        try:
            df = xl.parse(sheet_name)
        except Exception as e:
            print(f"Error al abrir la pestaña {sheet_name}: {e}")
            return []
            
        row_labels = df.iloc[0].tolist() # Qo, Qw, Qg, Np, Gp, etc.
        col_names = df.columns.tolist()  # Well names, Fechas, Date, etc.
        
        # Las fechas están en la primera columna a partir de la fila 1
        dates = [clean_date(d) for d in df.iloc[1:, 0]]
        
        records = []
        # Identificar columnas de pozos
        for col_idx in range(1, len(col_names)):
            col_header = str(col_names[col_idx]).strip()
            if col_header and not col_header.startswith("Unnamed:") and col_header != "Date" and col_header != "Fechas":
                well_name = clean_well_name(col_header)
                
                for row_offset, dt in enumerate(dates):
                    if dt is None:
                        continue
                    row_idx = row_offset + 1
                    
                    well_qo = 0.0
                    well_qw = 0.0
                    well_qg = 0.0
                    
                    for offset in range(0, 7):
                        curr_col = col_idx + offset
                        if curr_col >= len(col_names):
                            break
                        if offset > 0 and str(col_names[curr_col]).strip() and not str(col_names[curr_col]).startswith("Unnamed:"):
                            break
                            
                        label = str(row_labels[curr_col - 1]).strip() if curr_col > 0 else ""
                        val = clean_float(df.iloc[row_idx, curr_col])
                        val = 0.0 if val is None else val
                        
                        if label == "Qo":
                            well_qo = val
                        elif label == "Qw":
                            well_qw = val
                        elif label == "Qg":
                            well_qg = val
                            
                    total_liq = well_qo + well_qw
                    water_cut = (well_qw / total_liq * 100) if total_liq > 0 else 0.0
                    
                    records.append({
                        "well": well_name,
                        "rawWell": col_header,
                        "date": dt,
                        "oil_kbpd": well_qo / 1000.0,
                        "oil_bpd": well_qo,
                        "gas_mmscfd": well_qg,
                        "wtr_kbpd": well_qw / 1000.0,
                        "wtr_bpd": well_qw,
                        "water_cut": water_cut,
                        "notes": ""
                    })
        print(f"Extraídos {len(records)} registros de producción de {sheet_name}")
        return records

    production_records.extend(parse_horizontal_prod_sheet("Ek Production May2026", "Ek"))
    production_records.extend(parse_horizontal_prod_sheet("Balam Production May2026", "Balam"))

    # 4. Parse Pressures (Pws)
    print("Parsing Pressure sheets...")
    pressure_records = []
    
    # Pressure_EK
    df_p_ek = xl.parse("Pressure_EK", header=None)
    # Col index 4 is BKS, 11 is JSO_B I, 18 is JSO_B II, 25 is SUR
    ek_groups = [
        {"col_start": 4, "reservoir": "BKS"},
        {"col_start": 11, "reservoir": "JSO_B I"},
        {"col_start": 18, "reservoir": "JSO_B II"},
        {"col_start": 25, "reservoir": "SUR"}
    ]
    for grp in ek_groups:
        col = grp["col_start"]
        res = grp["reservoir"]
        # Data rows start at row index 3 (Row 2 in pandas if header=None)
        # Wait, let's verify what row index data starts in df_p_ek
        # In explore_details output:
        # Row 2: [nan, nan, nan, nan, 'Date', 'Pws (kg/cm2)', 'Well', 'Comments']
        # Row 3: [..., datetime.datetime(1991, 5, 12), 305, 'Ek-31', nan]
        # So data starts at Row 3 (0-based)
        for r_idx in range(3, len(df_p_ek)):
            row = df_p_ek.iloc[r_idx]
            raw_date = row[col]
            raw_pws = row[col+1]
            raw_well = row[col+2]
            raw_comm = row[col+3]
            
            date_str = clean_date(raw_date)
            pws = clean_float(raw_pws)
            well = clean_well_name(raw_well)
            
            if date_str and well:
                pressure_records.append({
                    "field": "Ek",
                    "reservoir": res,
                    "well": well,
                    "date": date_str,
                    "pws_kgcm2": pws,
                    "pws_psi": pws * 14.2233 if pws is not None else None,
                    "comments": str(raw_comm).strip() if not pd.isna(raw_comm) else ""
                })
                
    # Pressure_Balam
    df_p_ba = xl.parse("Pressure_Balam", header=None)
    # Col index 4 is BKS, 11 is JSO, 18 is Sur
    ba_groups = [
        {"col_start": 4, "reservoir": "BKS"},
        {"col_start": 11, "reservoir": "JSO"},
        {"col_start": 18, "reservoir": "Sur"}
    ]
    for grp in ba_groups:
        col = grp["col_start"]
        res = grp["reservoir"]
        for r_idx in range(3, len(df_p_ba)):
            row = df_p_ba.iloc[r_idx]
            raw_date = row[col]
            raw_pws = row[col+1]
            raw_well = row[col+2]
            raw_comm = row[col+3]
            
            date_str = clean_date(raw_date)
            pws = clean_float(raw_pws)
            well = clean_well_name(raw_well)
            
            if date_str and well:
                pressure_records.append({
                    "field": "Balam",
                    "reservoir": res,
                    "well": well,
                    "date": date_str,
                    "pws_kgcm2": pws,
                    "pws_psi": pws * 14.2233 if pws is not None else None,
                    "comments": str(raw_comm).strip() if not pd.isna(raw_comm) else ""
                })

    # 5. Parse Water Injection
    print("Parsing Water Injection sheets...")
    injection_records = []
    
    # Ek_Injection
    df_inj_ek = xl.parse("Ek_Injection", header=None)
    # Row 3 is 'Injection rate (bwpd)', Row 4 is columns: ['Date', 'Ek-42', 'Ek-88', 'Ek-86', 'Ek-51', 'Ek-A Perf 2', 'TOTAL', ...]
    # Columns starts at col index 1 ('Date')
    headers_ek = list(df_inj_ek.iloc[4])
    for r_idx in range(5, len(df_inj_ek)):
        row = df_inj_ek.iloc[r_idx]
        raw_date = row[1]
        date_str = clean_date(raw_date)
        if date_str is None:
            continue
        for col_idx in range(2, len(headers_ek)):
            well_header = headers_ek[col_idx]
            if pd.isna(well_header):
                continue
            well_name = str(well_header).strip()
            # If total or block summary, keep it as category
            val = clean_float(row[col_idx])
            if val is not None:
                injection_records.append({
                    "field": "Ek",
                    "well": clean_well_name(well_name) if well_name not in ["TOTAL", "Bloque 1", "Bloque 2"] else well_name,
                    "date": date_str,
                    "rate_bwpd": val
                })
                
    # Balam_Injection
    df_inj_ba = xl.parse("Balam_Injection", header=None)
    # Row 4 is columns: ['Balam 1', 'Date', 'Balam-69', 'Balam-9', 'Balam-98', 'Balam-A', 'Balam-53', 'Balam-99', 'Balam-TD', 'Balam SH', 'Total']
    headers_ba = list(df_inj_ba.iloc[4])
    for r_idx in range(5, len(df_inj_ba)):
        row = df_inj_ba.iloc[r_idx]
        raw_date = row[1]
        date_str = clean_date(raw_date)
        if date_str is None:
            continue
        for col_idx in range(2, len(headers_ba)):
            well_header = headers_ba[col_idx]
            if pd.isna(well_header):
                continue
            well_name = str(well_header).strip()
            val = clean_float(row[col_idx])
            if val is not None:
                injection_records.append({
                    "field": "Balam",
                    "well": clean_well_name(well_name) if well_name.lower() not in ["total", "total general"] else "TOTAL",
                    "date": date_str,
                    "rate_bwpd": val
                })

    # 6. Parse ESP Operating parameters
    print("Parsing ESP Operating Parameters...")
    df_esp_live = xl.parse("ESP_EK-Balam", header=None)
    # Row 3 has columns: ['Platform', 'Well', 'Oil\n(bbl/d)', 'Freq.\n(Hz)', 'Current (Amperes)', nan, nan, 'Insulation to\nGround (MΩ)', 'Phase-to-\nPhase (Ω)', 'VFD\nBrand', 'Last Megger\nTest Date', 'Motor Temp.\n(°C)', 'Downhole Sensor\nOperating']
    # Platform is col 0, Well is col 1, ffill Platform
    df_esp_live[0] = df_esp_live[0].ffill()
    esp_live_dict = {}
    for r_idx in range(5, len(df_esp_live)):
        row = df_esp_live.iloc[r_idx]
        raw_well = row[1]
        if pd.isna(raw_well):
            continue
        well_name = clean_well_name(raw_well)
        if not well_name:
            continue
            
        megger_date = clean_date(row[10])
        
        esp_live_dict[well_name] = {
            "well": well_name,
            "platform": str(row[0]).strip() if not pd.isna(row[0]) else "",
            "oil_bpd": clean_float(row[2]),
            "frequency_hz": clean_float(row[3]),
            "current_a": str(row[4]).strip() if not pd.isna(row[4]) else "",
            "current_b": str(row[5]).strip() if not pd.isna(row[5]) else "",
            "current_c": str(row[6]).strip() if not pd.isna(row[6]) else "",
            "insulation_mohm": str(row[7]).strip() if not pd.isna(row[7]) else "",
            "phase_to_phase_ohm": str(row[8]).strip() if not pd.isna(row[8]) else "",
            "vfd_brand": str(row[9]).strip() if not pd.isna(row[9]) else "",
            "last_megger_date": megger_date,
            "motor_temp_c": str(row[11]).strip() if not pd.isna(row[11]) else "",
            "sensor_operating": str(row[12]).strip() if not pd.isna(row[12]) else "",
            "field": "Ek" if well_name.lower().startswith("ek") else "Balam",
            "reservoir": "",
            "vendor": "",
            "risk_zone": ""
        }

    # Merge with ESP operations specs
    print("Parsing ESP Operations Specifications...")
    df_esp_ops = xl.parse("ESP_Operations", header=None)
    # Row 3 is columns: ['Well Name', 'Platform', 'Field', 'Reservoir', 'ESP Vendor\n(pre-filled)', 'ESP Model /\nSeries', 'Motor HP\n(kW)', 'No. of\nStages', 'Pump Set\nDepth (m TVD)', 'Screen Size\n(micron)', 'Freq\n(Hz)', 'Current\nA-Phase (A)', ...]
    for r_idx in range(4, len(df_esp_ops)):
        row = df_esp_ops.iloc[r_idx]
        raw_well = row[0]
        if pd.isna(raw_well):
            continue
        well_name = clean_well_name(raw_well)
        if not well_name:
            continue
            
        field = str(row[2]).strip() if not pd.isna(row[2]) else ""
        reservoir = str(row[3]).strip() if not pd.isna(row[3]) else ""
        esp_vendor = str(row[4]).strip() if not pd.isna(row[4]) else ""
        esp_model = str(row[5]).strip() if not pd.isna(row[5]) else ""
        motor_hp = str(row[6]).strip() if not pd.isna(row[6]) else ""
        stages = str(row[7]).strip() if not pd.isna(row[7]) else ""
        pump_depth = str(row[8]).strip() if not pd.isna(row[8]) else ""
        screen_size = str(row[9]).strip() if not pd.isna(row[9]) else ""
        risk_zone = str(row[18]).strip() if not pd.isna(row[18]) else ""
        
        # Merge
        if well_name in esp_live_dict:
            esp_live_dict[well_name].update({
                "field": field,
                "reservoir": reservoir,
                "vendor": esp_vendor,
                "risk_zone": risk_zone,
                "model": esp_model,
                "motor_hp": motor_hp,
                "stages": stages,
                "pump_depth_m_tvd": pump_depth,
                "screen_size_micron": screen_size
            })
        else:
            # Create a new record
            esp_live_dict[well_name] = {
                "well": well_name,
                "platform": str(row[1]).strip() if not pd.isna(row[1]) else "",
                "field": field,
                "reservoir": reservoir,
                "vendor": esp_vendor,
                "risk_zone": risk_zone,
                "oil_bpd": None, "frequency_hz": None, "current_a": "", "current_b": "", "current_c": "",
                "insulation_mohm": "", "phase_to_phase_ohm": "", "vfd_brand": "", "last_megger_date": None,
                "motor_temp_c": "", "sensor_operating": "",
                "model": esp_model, "motor_hp": motor_hp, "stages": stages,
                "pump_depth_m_tvd": pump_depth, "screen_size_micron": screen_size
            }

    # 7. Parse ESP Workover Timing
    print("Parsing ESP Workover Timing...")
    df_wo_time = xl.parse("ESP Workover Timing", header=None)
    # Row 6: columns: Activity, Days
    wo_timings = []
    for r_idx in range(7, len(df_wo_time)):
        row = df_wo_time.iloc[r_idx]
        act = row[0]
        days = row[1]
        if pd.isna(act) or pd.isna(days):
            continue
        try:
            days_val = float(str(days).strip())
            wo_timings.append({
                "activity": str(act).strip(),
                "days": days_val
            })
        except:
            pass

    # 8. Parse Chemical Treatment
    print("Parsing Chemical Treatments...")
    df_chem = xl.parse("Chemical_Treatment", header=None)
    # Columns are at Row 3 (index 3). Row 4 starts data.
    # We split by Section A and Section B.
    # Platform / System, Chemical Type, Product Name / ID, Supplier / Manufacturer, Injection Point, Treat. Mode (Cont/Batch), Dose Rate (ppm), Dose Rate (L/day or L/m3), Target Conc. (ppm), Sampled & Verified (Y/N), Last Review Date, Effectiveness (1-5), Notes
    chem_treatments = []
    current_section = "A"
    
    for r_idx in range(3, len(df_chem)):
        row = df_chem.iloc[r_idx]
        val0 = str(row[0]).strip() if not pd.isna(row[0]) else ""
        
        if "SECTION B" in val0:
            current_section = "B"
            continue
        if "SECTION A" in val0 or "Platform /" in val0 or val0 == "":
            continue
            
        review_date = clean_date(row[10])
        
        chem_treatments.append({
            "section": current_section,
            "platform_system": val0,
            "chemical_type": str(row[1]).strip() if not pd.isna(row[1]) else "",
            "product_name": str(row[2]).strip() if not pd.isna(row[2]) else "",
            "supplier": str(row[3]).strip() if not pd.isna(row[3]) else "",
            "injection_point": str(row[4]).strip() if not pd.isna(row[4]) else "",
            "treatment_mode": str(row[5]).strip() if not pd.isna(row[5]) else "",
            "dose_rate_ppm": str(row[6]).strip() if not pd.isna(row[6]) else "",
            "dose_rate_l_day": str(row[7]).strip() if not pd.isna(row[7]) else "",
            "target_conc_ppm": str(row[8]).strip() if not pd.isna(row[8]) else "",
            "sampled_verified": str(row[9]).strip() if not pd.isna(row[9]) else "",
            "last_review_date": review_date,
            "effectiveness": str(row[11]).strip() if not pd.isna(row[11]) else "",
            "notes": str(row[12]).strip() if not pd.isna(row[12]) else ""
        })

    # 9. Parse Water Diagnostics (EK-BKS Water Diagnostic)
    print("Parsing Water Diagnostics...")
    df_diag = xl.parse("EK-BKS Water Diagnostic", header=None)
    # Row 3 columns: Well, Qliq, Qo, Qw, Qo crit, Diagnostic, Proposal
    water_diagnostics = []
    for r_idx in range(4, len(df_diag)):
        row = df_diag.iloc[r_idx]
        well = row[1]
        if pd.isna(well):
            continue
        well_name = clean_well_name(well)
        water_diagnostics.append({
            "well": well_name,
            "rawWell": str(well).strip(),
            "liq_rate_mbd": clean_float(row[2]),
            "oil_rate_mbd": clean_float(row[3]),
            "wtr_rate_mbd": clean_float(row[4]),
            "critical_oil_rate_mbd": clean_float(row[5]),
            "diagnostic": str(row[6]).strip() if not pd.isna(row[6]) else "",
            "proposal": str(row[7]).strip() if not pd.isna(row[7]) else ""
        })

    # 10. Parse ESP Historical Costs
    print("Parsing ESP Historical Costs...")
    df_esp_costs = xl.parse("ESP Historical Costs", header=None)
    # Row 6: Date, Well, Type of Equipment, Cost (MXN MM), Exchange Rate, Cost (USD)
    esp_costs = []
    for r_idx in range(7, len(df_esp_costs)):
        row = df_esp_costs.iloc[r_idx]
        raw_date = row[1]
        well = row[2]
        date_str = clean_date(raw_date)
        if date_str is None or pd.isna(well):
            continue
        esp_costs.append({
            "date": date_str,
            "well": clean_well_name(well),
            "equipment_type": str(row[3]).strip() if not pd.isna(row[3]) else "",
            "cost_mxn_mm": clean_float(row[4]),
            "exchange_rate": clean_float(row[5]),
            "cost_usd_mm": clean_float(row[6]),
            "notes": str(row[8]).strip() if not pd.isna(row[8]) else ""
        })

    # 11. Parse Historical D&C
    print("Parsing Historical D&C Rigs...")
    df_dc = xl.parse("Historical D&C", header=None)
    # Row 4: Date, Well, Drilling Equipment, Platform Type, Drilling Days, Completion Days, D&C Cost (MXN MM), Exchange rate
    dc_records = []
    for r_idx in range(5, len(df_dc)):
        row = df_dc.iloc[r_idx]
        raw_date = row[1]
        well = row[2]
        # Date is sometimes integer year (like 2019) or standard date
        date_str = clean_date(raw_date) or "1970-01-01"
        if pd.isna(well):
            continue
        dc_records.append({
            "date": date_str,
            "well": clean_well_name(well),
            "rig": str(row[3]).strip() if not pd.isna(row[3]) else "",
            "platform_type": str(row[4]).strip() if not pd.isna(row[4]) else "",
            "drilling_days": clean_float(row[5]),
            "completion_days": clean_float(row[6]),
            "cost_mxn_mm": clean_float(row[7]),
            "exchange_rate": clean_float(row[8]),
            "cost_usd_mm": (clean_float(row[7]) / clean_float(row[8])) if clean_float(row[7]) and clean_float(row[8]) else None
        })

    # 12. Parse Pemex WO Plan
    print("Parsing Pemex WO Plan...")
    df_wo_plan = xl.parse("Pemex WO Plan")
    df_wo_plan.columns = [c.strip() for c in df_wo_plan.columns]
    wo_plan_records = []
    for idx, row in df_wo_plan.iterrows():
        equipment = str(row['Equipment']).strip() if not pd.isna(row['Equipment']) else ""
        if not equipment or equipment.lower() == "nan":
            continue
        well_name = clean_well_name(row['Well Name']) if not pd.isna(row['Well Name']) else ""
        platform = str(row.get('Platform ', row.get('Platform', ''))).strip()
        if pd.isna(platform) or platform.lower() == "nan":
            platform = ""
            
        pozos = str(row['Pozos']).strip() if not pd.isna(row['Pozos']) else ""
        formation = str(row['Formation']).strip() if not pd.isna(row['Formation']) else ""
        wo_type = str(row['Type']).strip() if not pd.isna(row['Type']) else ""
        subtype = str(row['Subtype']).strip() if not pd.isna(row['Subtype']) else ""
        
        start_date = clean_date(row['Start'])
        end_date = clean_date(row['End'])
        qo = clean_float(row['Qo'])
        comments = str(row['COMMENTS']).strip() if not pd.isna(row['COMMENTS']) else ""
        
        wo_plan_records.append({
            "equipment": equipment,
            "platform": platform,
            "pozos": pozos,
            "well_name": well_name,
            "formation": formation,
            "type": wo_type,
            "subtype": subtype,
            "start": start_date,
            "end": end_date,
            "qo": qo,
            "comments": comments
        })

    # 13. Parse Production History
    print("Parsing Production History...")
    df_prod_hist = xl.parse("Production History", skiprows=1)
    
    date_col = 'Etiquetas de fila'
    df_prod_hist[date_col] = pd.to_datetime(df_prod_hist[date_col])
    
    well_cols = [c for c in df_prod_hist.columns if c not in ['Unnamed: 0', date_col]]
    
    wells_avail_data = []
    uptimes = []
    downtimes = []
    availabilities = []
    
    for well in well_cols:
        series = df_prod_hist[well]
        active_indices = df_prod_hist[df_prod_hist[well] > 0].index
        
        if len(active_indices) > 0:
            first_idx = active_indices.min()
            last_idx = active_indices.max()
            
            analyzed_series = series.loc[first_idx:last_idx].fillna(0)
            
            uptime = int((analyzed_series > 0).sum())
            downtime = int((analyzed_series == 0).sum())
            total = uptime + downtime
            availability = float(uptime / total) if total > 0 else 0.0
            
            uptimes.append(uptime)
            downtimes.append(downtime)
            availabilities.append(availability)
            
            well_timeline = []
            for idx in range(first_idx, last_idx + 1):
                date_str = df_prod_hist.loc[idx, date_col].strftime('%Y-%m-%d')
                val = df_prod_hist.loc[idx, well]
                state = 1 if (not pd.isna(val) and val > 0) else 0
                well_timeline.append({
                    "date": date_str,
                    "val": float(val) if not pd.isna(val) else 0.0,
                    "state": state
                })
                
            wells_avail_data.append({
                "well": clean_well_name(well),
                "first_active": df_prod_hist.loc[first_idx, date_col].strftime('%Y-%m-%d'),
                "last_active": df_prod_hist.loc[last_idx, date_col].strftime('%Y-%m-%d'),
                "uptime": uptime,
                "downtime": downtime,
                "availability": availability,
                "timeline": well_timeline
            })
            
    # Compute field stats
    import numpy as np
    field_stats = {}
    if len(wells_avail_data) > 0:
        field_stats = {
            "uptime": {
                "p10": float(np.percentile(uptimes, 10)),
                "p50": float(np.percentile(uptimes, 50)),
                "p90": float(np.percentile(uptimes, 90)),
                "mean": float(np.mean(uptimes))
            },
            "downtime": {
                "p10": float(np.percentile(downtimes, 10)),
                "p50": float(np.percentile(downtimes, 50)),
                "p90": float(np.percentile(downtimes, 90)),
                "mean": float(np.mean(downtimes))
            },
            "availability": {
                "p10": float(np.percentile(availabilities, 10)),
                "p50": float(np.percentile(availabilities, 50)),
                "p90": float(np.percentile(availabilities, 90)),
                "mean": float(np.mean(availabilities))
            }
        }

    # COMPACT AND OUTPUT
    data_structure = {
        "wells": list(wells_dict.values()),
        "production": production_records,
        "pressure": pressure_records,
        "injection": injection_records,
        "esp": list(esp_live_dict.values()),
        "esp_workover_schedule": wo_timings,
        "chemical_treatment": chem_treatments,
        "water_diagnostics": water_diagnostics,
        "esp_historical_costs": esp_costs,
        "historical_dc": dc_records,
        "pemex_wo_plan": wo_plan_records,
        "wells_availability": wells_avail_data,
        "field_availability_stats": field_stats
    }
    
    print("\nExtraction Summary:")
    print(f"- Wells count: {len(data_structure['wells'])}")
    print(f"- Production records: {len(data_structure['production'])}")
    print(f"- Pressure records: {len(data_structure['pressure'])}")
    print(f"- Injection records: {len(data_structure['injection'])}")
    print(f"- ESP records: {len(data_structure['esp'])}")
    print(f"- ESP workover steps: {len(data_structure['esp_workover_schedule'])}")
    print(f"- Chemical treatment rows: {len(data_structure['chemical_treatment'])}")
    print(f"- Water diagnostics: {len(data_structure['water_diagnostics'])}")
    print(f"- ESP cost events: {len(data_structure['esp_historical_costs'])}")
    print(f"- D&C rig history records: {len(data_structure['historical_dc'])}")
    print(f"- Pemex WO Plan records: {len(data_structure['pemex_wo_plan'])}")
    print(f"- Wells Availability records: {len(data_structure['wells_availability'])}")
    
    public_dir = r"d:\3_Trabajo\65_Sierra Madre\1_Ek-Balam\17_Actuliación Cuarto de Datos\Ek-Balam Viewer\public"
    os.makedirs(public_dir, exist_ok=True)
    
    # Save as static js file
    output_js_path = os.path.join(public_dir, "data.js")
    with open(output_js_path, "w", encoding="utf-8") as f:
        f.write("/* Automatically generated by scripts/extract_data.py */\n")
        f.write("window.FIELD_DATA = ")
        json.dump(data_structure, f, ensure_ascii=False, indent=2)
        f.write(";\n")
        
    print(f"\nSuccessfully wrote data to: {output_js_path}")

if __name__ == "__main__":
    main()

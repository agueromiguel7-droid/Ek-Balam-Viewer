document.addEventListener("DOMContentLoaded", () => {
  // Check if data is available
  if (!window.FIELD_DATA) {
    console.error("FIELD_DATA is missing. Make sure public/data.js is loaded.");
    alert("Error: No se pudo cargar el archivo de datos (data.js). Corra python scripts/extract_data.py primero.");
    return;
  }

  // State Variables
  let currentView = "dashboard";
  let activeField = "ALL";
  let activeReservoir = "ALL";
  let activeProdWell = "ALL";
  let isDarkMode = false;
  let currentLang = localStorage.getItem("ekbalam_lang") || "es";
  
  // Map and Chart instances
  let leafletMap = null;
  let activeMapMarkers = [];
  let lightTileLayer = null;
  let darkTileLayer = null;
  
  let dashProdChart = null;
  let dashWellTypeChart = null;
  let prodHistoryChart = null;
  let prodWcChart = null;
  let pressureDeclineChart = null;
  let injectionChart = null;
  let dcDaysChart = null;

  // DOM Elements
  const menuItems = document.querySelectorAll(".menu-item");
  const moduleViews = document.querySelectorAll(".module-view");
  const viewTitle = document.getElementById("view-title");
  const filterField = document.getElementById("filter-field");
  const filterReservoir = document.getElementById("filter-reservoir");
  const themeBtn = document.getElementById("theme-btn");
  const prodWellSelect = document.getElementById("prod-well-select");
  const mapWellSearch = document.getElementById("map-well-search");
  const languageSelect = document.getElementById("language-select");

  // Set initial language selector value
  if (languageSelect) {
    languageSelect.value = currentLang;
  }

  // Translation Dictionary
  const TRANSLATIONS = {
    es: {
      sidebar_subtitle: "VISOR DE CUARTO DE DATOS",
      menu_dashboard: "Resumen General",
      menu_map: "Mapa de Pozos",
      menu_production: "Prod. de Hidrocarburos",
      menu_pressure: "Presiones de Yacimiento",
      menu_injection: "Inyección de Agua",
      menu_esp: "Operación de BECs",
      menu_chemical: "Tratamiento Químico",
      menu_dc: "Perforación y Costos",
      theme_toggle_title: "Alternar Modo Oscuro",
      filter_field_title: "Filtrar por Campo",
      filter_fields_all: "Campos: Todos",
      filter_fields_ek: "Campo: Ek",
      filter_fields_balam: "Campo: Balam",
      filter_reservoir_title: "Filtrar por Yacimiento",
      filter_reservoirs_all: "Yacimientos: Todos",
      filter_reservoirs_jso: "Yacimiento: JSO",
      filter_reservoirs_bks: "Yacimiento: BKS",
      filter_reservoirs_sur: "Yacimiento: Sur",
      kpi_avg_oil_daily: "Prod. Diaria Promedio (Crudo)",
      kpi_avg_gas_daily: "Prod. Diaria Promedio (Gas)",
      kpi_total_registered_wells: "Pozos Totales Registrados",
      kpi_operating_esp_systems: "Sistemas BEC Operando",
      kpi_trend_recent: "<i class=\"fa-solid fa-arrow-trend-up\"></i> Histórico Reciente",
      kpi_trend_db: "<i class=\"fa-solid fa-check\"></i> Base de Datos",
      kpi_trend_active: "<i class=\"fa-solid fa-plug\"></i> Activos",
      card_title_field_prod_history: "<i class=\"fa-solid fa-chart-area\"></i> Histórico de Producción del Campo",
      card_title_well_dist: "<i class=\"fa-solid fa-filter\"></i> Distribución de Pozos",
      label_wells_by_status: "Pozos por Estado:",
      label_status_operating: "Operando:",
      label_status_shutin: "Cerrados (Shut-in):",
      label_status_injectors: "Inyectores:",
      card_title_map: "<i class=\"fa-solid fa-compass\"></i> Ubicación Geográfica de Pozos (UTM a Lat/Lon)",
      card_title_coords: "<i class=\"fa-solid fa-list\"></i> Coordenadas UTM y Elevación de Pozos",
      search_placeholder: "Buscar pozo...",
      th_well_name: "Nombre Pozo",
      th_platform: "Plataforma",
      th_reservoir_top: "Yacimiento (Cima)",
      th_utm_x: "UTM X (E)",
      th_utm_y: "UTM Y (N)",
      th_z_depth: "Z (TVD, m)",
      th_md_depth: "MD (m)",
      th_status: "Estado",
      th_action: "Acción",
      label_select_individual_well: "SELECCIONAR POZO INDIVIDUAL",
      option_show_field_total: "-- Mostrar Total del Campo --",
      kpi_avg_oil_prod: "Prod. Promedio Aceite",
      kpi_avg_water_prod: "Prod. Promedio Agua",
      kpi_water_cut: "Corte de Agua (Water Cut)",
      kpi_avg_gas_prod: "Gas Producido Promedio",
      card_title_well_field_prod_history: "<i class=\"fa-solid fa-chart-line\"></i> Histórico de Producción del Pozo/Campo",
      card_title_water_cut_history: "<i class=\"fa-solid fa-chart-line\"></i> Histórico de Corte de Agua (Water Cut)",
      kpi_press_initial: "Presión Inicial Registrada",
      kpi_press_recent: "Presión Reciente Mínima",
      kpi_press_loss: "Pérdida de Presión Estimada",
      card_title_press_decline: "<i class=\"fa-solid fa-gauge\"></i> Curvas de Declinación de Presión Estática de Fondo (Pws)",
      card_title_press_history: "<i class=\"fa-solid fa-file-invoice\"></i> Historial Detallado de Registros de Presión",
      th_date_record: "Fecha Registro",
      th_well: "Pozo",
      th_field: "Campo",
      th_reservoir_block: "Yacimiento / Bloque",
      th_pws_kgcm2: "Presión Pws (kg/cm²)",
      th_pws_psi: "Presión Pws (psi)",
      th_comments: "Comentarios / Notas",
      kpi_active_injectors: "Pozos Inyectores Activos",
      kpi_avg_injection: "Inyección Promedio de Agua",
      kpi_cum_injected: "Volumen Acumulado Inyectado",
      card_title_inj_history: "<i class=\"fa-solid fa-chart-area\"></i> Tasa de Inyección de Agua por Pozo Inyector",
      card_title_water_diag: "<i class=\"fa-solid fa-triangle-exclamation\"></i> Diagnósticos de Agua en Yacimientos (EK-BKS)",
      th_q_liquid: "Q Líquido (Mbd)",
      th_q_oil: "Q Aceite (Mbd)",
      th_q_water: "Q Agua (Mbd)",
      th_q_critical: "Q Aceite Crítico (Mbd)",
      th_diagnostic: "Diagnóstico de Irrupción",
      th_mitigation: "Propuesta de Mitigación",
      esp_risk_title: "ALERTA CRÍTICA DE INTEGRIDAD: Incrustación de Carbonato de Calcio (CaCO3)",
      esp_risk_desc: "El agua de inyección marina es filtrada pero <strong>NO recibe tratamiento químico inhibitorio de incrustación de CaCO3 antes de inyectar</strong>. Esto provoca severa precipitación y daño en los sistemas de Bombeo Electrocentrífugo (BEC). <br/><strong>Preguntas claves para Pemex:</strong> (1) ¿Cuál es la dosificación de inhibidor en agua? (2) ¿Qué pozos tienen inyección por capilar en fondo? (3) ¿Existe programa de squeeze? (4) ¿Cuál es el tratamiento químico en Ek-TB?",
      kpi_esp_active_label: "Sistemas BEC Operando",
      kpi_esp_freq_label: "Frecuencia Promedio de Operación",
      kpi_esp_sensor_label: "Falla de Sensor de Fondo (Aislado)",
      card_title_esp_params: "<i class=\"fa-solid fa-list-check\"></i> Parámetros Operativos BEC - Pozos del Campo",
      th_oil_prod_bpd: "Prod. Aceite (bpd)",
      th_freq_hz: "Freq (Hz)",
      th_corr_a: "Corr A (Amp)",
      th_corr_b: "Corr B (Amp)",
      th_corr_c: "Corr C (Amp)",
      th_ground_ins: "Ais. Tierra (MΩ)",
      th_phase_phase: "Fase-Fase (Ω)",
      th_vfd_brand: "Marca VFD",
      th_last_megger: "Última Prueba Megger",
      th_motor_temp: "Temp. Motor (°C)",
      th_sensor_status: "Sensor Fondo Activo",
      card_title_esp_timeline: "<i class=\"fa-solid fa-timeline\"></i> Cronograma Crítico de Reparación BEC (RME - 25 Días)",
      card_title_esp_costs: "<i class=\"fa-solid fa-comments-dollar\"></i> Costos Históricos de Reparaciones de Sistemas BEC",
      th_fail_date: "Fecha Falla",
      th_eq_installed: "Equipo Instalado",
      th_cost_mxn: "Costo (MXN MM)",
      th_cost_usd: "Costo (USD MM)",
      chem_title: "Programa de Inyección de Químicos y Aseguramiento de Flujo",
      chem_desc: "Resumen de la dosificación de bactericidas, coagulantes, secuestradores de oxígeno, e inhibidores de corrosión. Las dosificaciones buscan evitar biocorrosión por sulfato-reductoras y atascamiento del impulsor de la bomba por sarro.",
      card_chem_a: "<i class=\"fa-solid fa-bucket\"></i> Sección A - Tratamiento Químico en Plantas de Inyección (Agua Marina)",
      th_platform_plant: "Plataforma / Planta",
      th_chem_type: "Tipo Químico",
      th_product_name: "Nombre Producto",
      th_supplier: "Proveedor",
      th_inj_point: "Punto de Inyección",
      th_mode: "Modo",
      th_dosage: "Dosificación (ppm)",
      th_rate_l_day: "Tasa (L/día)",
      th_target_conc: "Conc. Objetivo (ppm)",
      th_verified: "Verificado",
      th_last_analysis: "Último Análisis",
      th_efficacy: "Eficacia (1-5)",
      card_chem_b: "<i class=\"fa-solid fa-flask-vial\"></i>  Sección B - Tratamiento Químico a Nivel de Pozo (Fondo)",
      th_well_system: "Pozo / Sistema",
      kpi_drill_days: "Días Promedio de Perforación",
      kpi_comp_days: "Días Promedio de Terminación",
      kpi_avg_dc_cost: "Costo Promedio D&C",
      card_dc_days_chart: "<i class=\"fa-solid fa-chart-column\"></i> Duración de Actividades de Perforación y Terminación por Pozo",
      card_dc_rigs: "<i class=\"fa-solid fa-anchor\"></i> Historial de Equipos de Perforación y Costos D&C",
      th_start_date: "Fecha Inicio",
      th_well_name: "Nombre Pozo",
      th_drilling_rig: "Equipo de Perforación",
      th_rig_type: "Tipo de Plataforma",
      th_drill_days: "Días Perforación",
      th_comp_days: "Días Terminación",
      th_exchange_rate: "Tasa de Cambio"
    },
    en: {
      sidebar_subtitle: "DATA ROOM VIEWER",
      menu_dashboard: "General Summary",
      menu_map: "Wells Map",
      menu_production: "Hydrocarbon Production",
      menu_pressure: "Reservoir Pressures",
      menu_injection: "Water Injection",
      menu_esp: "ESP Operations",
      menu_chemical: "Chemical Treatment",
      menu_dc: "Drilling & Costs",
      theme_toggle_title: "Toggle Dark Mode",
      filter_field_title: "Filter by Field",
      filter_fields_all: "Fields: All",
      filter_fields_ek: "Field: Ek",
      filter_fields_balam: "Field: Balam",
      filter_reservoir_title: "Filter by Reservoir",
      filter_reservoirs_all: "Reservoirs: All",
      filter_reservoirs_jso: "Reservoir: JSO",
      filter_reservoirs_bks: "Reservoir: BKS",
      filter_reservoirs_sur: "Reservoir: Sur",
      kpi_avg_oil_daily: "Average Daily Prod. (Crude)",
      kpi_avg_gas_daily: "Average Daily Prod. (Gas)",
      kpi_total_registered_wells: "Total Registered Wells",
      kpi_operating_esp_systems: "Operating ESP Systems",
      kpi_trend_recent: "<i class=\"fa-solid fa-arrow-trend-up\"></i> Recent History",
      kpi_trend_db: "<i class=\"fa-solid fa-check\"></i> Database",
      kpi_trend_active: "<i class=\"fa-solid fa-plug\"></i> Active",
      card_title_field_prod_history: "<i class=\"fa-solid fa-chart-area\"></i> Field Production History",
      card_title_well_dist: "<i class=\"fa-solid fa-filter\"></i> Well Distribution",
      label_wells_by_status: "Wells by Status:",
      label_status_operating: "Operating:",
      label_status_shutin: "Closed (Shut-in):",
      label_status_injectors: "Injectors:",
      card_title_map: "<i class=\"fa-solid fa-compass\"></i> Geographical Well Locations (UTM to Lat/Lon)",
      card_title_coords: "<i class=\"fa-solid fa-list\"></i> UTM Coordinates and Well Elevation",
      search_placeholder: "Search well...",
      th_well_name: "Well Name",
      th_platform: "Platform",
      th_reservoir_top: "Reservoir (Top)",
      th_utm_x: "UTM X (E)",
      th_utm_y: "UTM Y (N)",
      th_z_depth: "Z (TVD, m)",
      th_md_depth: "MD (m)",
      th_status: "Status",
      th_action: "Action",
      label_select_individual_well: "SELECT INDIVIDUAL WELL",
      option_show_field_total: "-- Show Field Total --",
      kpi_avg_oil_prod: "Average Oil Prod.",
      kpi_avg_water_prod: "Average Water Prod.",
      kpi_water_cut: "Water Cut",
      kpi_avg_gas_prod: "Average Produced Gas",
      card_title_well_field_prod_history: "<i class=\"fa-solid fa-chart-line\"></i> Well/Field Production History",
      card_title_water_cut_history: "<i class=\"fa-solid fa-chart-line\"></i> Water Cut History",
      kpi_press_initial: "Initial Recorded Pressure",
      kpi_press_recent: "Minimum Recent Pressure",
      kpi_press_loss: "Estimated Pressure Loss",
      card_title_press_decline: "<i class=\"fa-solid fa-gauge\"></i> Static Bottomhole Pressure (Pws) Decline Curves",
      card_title_press_history: "<i class=\"fa-solid fa-file-invoice\"></i> Detailed Pressure Records History",
      th_date_record: "Record Date",
      th_well: "Well",
      th_field: "Field",
      th_reservoir_block: "Reservoir / Block",
      th_pws_kgcm2: "Pressure Pws (kg/cm²)",
      th_pws_psi: "Pressure Pws (psi)",
      th_comments: "Comments / Notes",
      kpi_active_injectors: "Active Water Injectors",
      kpi_avg_injection: "Average Water Injection",
      kpi_cum_injected: "Cumulative Injected Volume",
      card_title_inj_history: "<i class=\"fa-solid fa-chart-area\"></i> Water Injection Rate per Injector Well",
      card_title_water_diag: "<i class=\"fa-solid fa-triangle-exclamation\"></i> Reservoir Water Diagnostics (EK-BKS)",
      th_q_liquid: "Q Liquid (Mbd)",
      th_q_oil: "Q Oil (Mbd)",
      th_q_water: "Q Water (Mbd)",
      th_q_critical: "Q Critical Oil (Mbd)",
      th_diagnostic: "Breakthrough Diagnostic",
      th_mitigation: "Proposed Mitigation",
      esp_risk_title: "CRITICAL INTEGRITY ALERT: Calcium Carbonate (CaCO3) Scaling",
      esp_risk_desc: "Marine injection water is filtered but <strong>does NOT receive chemical scale inhibitor treatment for CaCO3 before injection</strong>. This causes severe precipitation and damage in Electrical Submersible Pump (ESP) systems. <br/><strong>Key questions for Pemex:</strong> (1) What is the inhibitor dosage in water? (2) Which wells have downhole capillary injection? (3) Is there a squeeze program? (4) What is the chemical treatment at Ek-TB?",
      kpi_esp_active_label: "Operating ESP Systems",
      kpi_esp_freq_label: "Average Operating Frequency",
      kpi_esp_sensor_label: "Downhole Sensor Failure (Isolated)",
      card_title_esp_params: "<i class=\"fa-solid fa-list-check\"></i> ESP Operational Parameters - Field Wells",
      th_oil_prod_bpd: "Oil Prod. (bpd)",
      th_freq_hz: "Freq (Hz)",
      th_corr_a: "Curr A (Amp)",
      th_corr_b: "Curr B (Amp)",
      th_corr_c: "Curr C (Amp)",
      th_ground_ins: "Gnd. Insulation (MΩ)",
      th_phase_phase: "Phase-Phase (Ω)",
      th_vfd_brand: "VFD Brand",
      th_last_megger: "Last Megger Test",
      th_motor_temp: "Motor Temp. (°C)",
      th_sensor_status: "Active Downhole Sensor",
      card_title_esp_timeline: "<i class=\"fa-solid fa-timeline\"></i> Critical ESP Workover Schedule (RME - 25 Days)",
      card_title_esp_costs: "<i class=\"fa-solid fa-comments-dollar\"></i> Historical Costs of ESP System Repairs",
      th_fail_date: "Failure Date",
      th_eq_installed: "Equipment Installed",
      th_cost_mxn: "Cost (MXN MM)",
      th_cost_usd: "Cost (USD MM)",
      chem_title: "Chemical Injection and Flow Assurance Program",
      chem_desc: "Summary of bactericides, coagulants, oxygen scavengers, and corrosion inhibitors dosage. These dosages aim to prevent biocorrosion by sulfate-reducing bacteria and pump impeller scaling.",
      card_chem_a: "<i class=\"fa-solid fa-bucket\"></i> Section A - Chemical Treatment at Injection Plants (Marine Water)",
      th_platform_plant: "Platform / Plant",
      th_chem_type: "Chemical Type",
      th_product_name: "Product Name",
      th_supplier: "Supplier",
      th_inj_point: "Injection Point",
      th_mode: "Mode",
      th_dosage: "Dosage (ppm)",
      th_rate_l_day: "Rate (L/day)",
      th_target_conc: "Target Conc (ppm)",
      th_verified: "Verified",
      th_last_analysis: "Last Analysis",
      th_efficacy: "Efficacy (1-5)",
      card_chem_b: "<i class=\"fa-solid fa-flask-vial\"></i>  Section B - Downhole Chemical Treatment (Well Level)",
      th_well_system: "Well / System",
      kpi_drill_days: "Average Drilling Days",
      kpi_comp_days: "Average Completion Days",
      kpi_avg_dc_cost: "Average D&C Cost",
      card_dc_days_chart: "<i class=\"fa-solid fa-chart-column\"></i> Drilling & Completion Duration by Well",
      card_dc_rigs: "<i class=\"fa-solid fa-anchor\"></i> Drilling Rigs History and D&C Costs",
      th_start_date: "Start Date",
      th_well_name: "Well Name",
      th_drilling_rig: "Drilling Rig",
      th_rig_type: "Rig Type",
      th_drill_days: "Drilling Days",
      th_comp_days: "Completion Days",
      th_exchange_rate: "Exchange Rate"
    }
  };

  // Helper Functions for Data Translation
  function translateWellType(type) {
    if (!type) return 'N/A';
    if (currentLang === 'es') return type;
    const lower = type.toLowerCase();
    if (lower.includes('productor')) return 'Producer';
    if (lower.includes('inyector') || lower.includes('inject')) return 'Injector';
    return type;
  }

  function translateStatus(status) {
    if (!status) return 'N/A';
    if (currentLang === 'es') return status;
    const lower = status.toLowerCase();
    if (lower.includes('operat') || lower.includes('operando')) return 'Operating';
    if (lower.includes('shut') || lower.includes('cerrado')) return 'Shut-in';
    return status;
  }

  function translateDbText(text) {
    if (!text) return '-';
    if (currentLang === 'es') return text;
    
    const mappings = {
      "Conificación de Agua": "Water Coning",
      "Canalización de Agua": "Water Channeling",
      "Barrido Ineficiente": "Inefficient Sweep",
      "Cerrar intervalos inferiores y evaluar recalificación": "Plug lower intervals and evaluate recompletion",
      "Reducir tasa de inyección en pozos de soporte": "Reduce injection rate in offset support wells",
      "Optimizar inyección en bloque y realizar perfiles de producción": "Optimize block injection and run production profiles",
      "Agua Marina filtrada pero sin tratamiento químico inhibitorio de incrustación": "Filtered seawater but without chemical scale inhibitor treatment",
      "Falla de sensor de fondo": "Downhole sensor failure",
      "Falla eléctrica en cable de potencia": "Electrical fault in power cable",
      "Desgaste mecánico de bomba": "Mechanical wear of pump",
      "Sobrecarga de motor": "Motor overload",
      "Bajo aislamiento": "Low insulation",
      "Bajo rendimiento": "Low performance"
    };

    for (const key in mappings) {
      if (text.toLowerCase() === key.toLowerCase()) {
        return mappings[key];
      }
      if (text.toLowerCase().includes(key.toLowerCase())) {
        return mappings[key];
      }
    }
    return text;
  }

  function translateActivity(act) {
    if (!act) return '';
    if (currentLang === 'es') return act;
    const mappings = {
      "Movilización de equipo y preparación": "Equipment mobilization & site prep",
      "Matar pozo y desmontar árbol de válvulas": "Kill well & disassemble Christmas tree",
      "Recuperar aparejo de producción y bomba dañada": "Retrieve production string & failed pump",
      "Análisis causa raíz preliminar en sitio": "Preliminary root cause analysis on site",
      "Acondicionar pozo y limpiar liner": "Condition well & clean liner",
      "Bajar aparejo nuevo con bomba BEC": "Run new string with ESP pump",
      "Pruebas de continuidad y aislamiento": "Continuity & insulation tests",
      "Montar árbol de válvulas y cabezal": "Assemble Christmas tree & wellhead",
      "Desmovilización de equipo de reparación": "Demobilize workover rig",
      "Arranque, optimización y entrega": "Startup, optimization & handover"
    };
    return mappings[act] || act;
  }

  function translateEquipmentType(eq) {
    if (!eq) return '-';
    if (currentLang === 'es') return eq;
    const mappings = {
      "Reemplazo Completo BEC": "Full ESP Replacement",
      "Cable y Motor": "Cable & Motor",
      "Bomba y VSD": "Pump & VFD",
      "Reemplazo Cable de Potencia": "Power Cable Replacement"
    };
    return mappings[eq] || eq;
  }

  function translateChemical(text) {
    if (!text) return '-';
    if (currentLang === 'es') return text;
    const mappings = {
      "Inhibidor de Corrosión": "Corrosion Inhibitor",
      "Secuestrante de Oxígeno": "Oxygen Scavenger",
      "Bactericida": "Bactericide",
      "Inhibidor de Incrustación": "Scale Inhibitor",
      "Coagulante": "Coagulant",
      "Continuo": "Continuous",
      "Intermitente": "Intermittent",
      "Batch": "Batch",
      "Sí": "Yes",
      "No": "No",
      "Pendiente": "Pending",
      "Línea de descarga": "Flowline",
      "Cabezal de inyección": "Injection manifold",
      "Fondo de pozo": "Downhole",
      "Succión de bomba": "Pump suction",
      "Entrada de planta": "Plant inlet"
    };
    for (const key in mappings) {
      if (text.toLowerCase() === key.toLowerCase()) return mappings[key];
    }
    return text;
  }

  function translateRigType(type) {
    if (!type) return '-';
    if (currentLang === 'es') return type;
    const mappings = {
      "Autoelevable": "Jack-up",
      "Semisumergible": "Semi-submersible",
      "Fija": "Fixed"
    };
    return mappings[type] || type;
  }

  // Update UI Language function
  function updateUILanguage() {
    document.documentElement.lang = currentLang;
    
    // Translate elements with text content
    const elements = document.querySelectorAll("[data-i18n]");
    elements.forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) {
        el.innerHTML = TRANSLATIONS[currentLang][key];
      }
    });

    // Translate placeholders
    const placeholders = document.querySelectorAll("[data-i18n-placeholder]");
    placeholders.forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) {
        el.placeholder = TRANSLATIONS[currentLang][key];
      }
    });

    // Translate titles
    const titles = document.querySelectorAll("[data-i18n-title]");
    titles.forEach(el => {
      const key = el.getAttribute("data-i18n-title");
      if (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) {
        el.title = TRANSLATIONS[currentLang][key];
      }
    });

    // Sync active menu title with header
    const activeMenuItem = document.querySelector(".menu-item.active span");
    if (activeMenuItem) {
      viewTitle.textContent = activeMenuItem.textContent;
    }
  }

  // Navigation Logic
  menuItems.forEach(item => {
    item.addEventListener("click", () => {
      menuItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      
      const targetView = item.getAttribute("data-view");
      moduleViews.forEach(v => v.classList.remove("active"));
      
      const activeElement = document.getElementById(`view-${targetView}`);
      activeElement.classList.add("active");
      
      currentView = targetView;
      viewTitle.textContent = item.querySelector("span").textContent;
      
      // Handle special view initializations
      handleViewSwitch(targetView);
    });
  });

  // Theme Toggle Logic
  themeBtn.addEventListener("click", () => {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle("dark", isDarkMode);
    
    // Update theme button icon
    const icon = themeBtn.querySelector("i");
    if (isDarkMode) {
      icon.className = "fa-solid fa-sun";
      themeBtn.title = currentLang === 'es' ? "Alternar Modo Claro" : "Toggle Light Mode";
    } else {
      icon.className = "fa-solid fa-moon";
      themeBtn.title = currentLang === 'es' ? "Alternar Modo Oscuro" : "Toggle Dark Mode";
    }
    
    // Update Leaflet Map tiles
    if (leafletMap) {
      if (isDarkMode) {
        leafletMap.removeLayer(lightTileLayer);
        darkTileLayer.addTo(leafletMap);
      } else {
        leafletMap.removeLayer(darkTileLayer);
        lightTileLayer.addTo(leafletMap);
      }
    }
    
    // Re-render charts with correct theme colors
    refreshAllCharts();
  });

  // Language Selection Listener
  if (languageSelect) {
    languageSelect.addEventListener("change", (e) => {
      currentLang = e.target.value;
      localStorage.setItem("ekbalam_lang", currentLang);
      updateUILanguage();
      
      // Update themeBtn title if it has changed
      const icon = themeBtn.querySelector("i");
      if (isDarkMode) {
        themeBtn.title = currentLang === 'es' ? "Alternar Modo Claro" : "Toggle Light Mode";
      } else {
        themeBtn.title = currentLang === 'es' ? "Alternar Modo Oscuro" : "Toggle Dark Mode";
      }
      
      // We must regenerate the production well selector options because they contain dynamic texts like "Sin Plataforma / No Platform"
      populateProdWellSelect();
      
      refreshCurrentView();
    });
  }

  // Global Filters Change
  filterField.addEventListener("change", (e) => {
    activeField = e.target.value;
    onFiltersChanged();
  });

  filterReservoir.addEventListener("change", (e) => {
    activeReservoir = e.target.value;
    onFiltersChanged();
  });

  // Specific well filter for production
  prodWellSelect.addEventListener("change", (e) => {
    activeProdWell = e.target.value;
    updateProductionView();
  });

  // Map well search input
  mapWellSearch.addEventListener("input", (e) => {
    renderCoordinatesTable(e.target.value);
  });

  // Filters change callback
  function onFiltersChanged() {
    // Populate well select dropdown for production based on field/reservoir filters
    populateProdWellSelect();
    
    // Reset specific well production if it's no longer in the filtered set
    activeProdWell = "ALL";
    prodWellSelect.value = "ALL";
    
    // Refresh current view
    refreshCurrentView();
  }

  // Trigger when switching menu tabs
  function handleViewSwitch(view) {
    if (view === "map") {
      initializeMap();
      setTimeout(() => {
        leafletMap.invalidateSize();
      }, 200);
      renderCoordinatesTable();
    } else if (view === "dashboard") {
      updateDashboardView();
    } else if (view === "production") {
      updateProductionView();
    } else if (view === "pressure") {
      updatePressureView();
    } else if (view === "injection") {
      updateInjectionView();
    } else if (view === "esp") {
      updateEspView();
    } else if (view === "chemical") {
      updateChemicalView();
    } else if (view === "dc") {
      updateDcView();
    }
  }

  function refreshCurrentView() {
    handleViewSwitch(currentView);
  }

  function refreshAllCharts() {
    // Force ApexCharts to destroy and recreate to apply theme colors properly
    refreshCurrentView();
  }

  // Filter helper functions
  function getFilteredWells() {
    return window.FIELD_DATA.wells.filter(w => {
      const matchField = activeField === "ALL" || w.field.toLowerCase() === activeField.toLowerCase();
      const matchRes = activeReservoir === "ALL" || w.reservoir.toLowerCase().includes(activeReservoir.toLowerCase());
      return matchField && matchRes;
    });
  }

  function getFilteredProduction() {
    const wells = getFilteredWells().map(w => w.name.toLowerCase());
    return window.FIELD_DATA.production.filter(p => {
      const matchWell = activeProdWell === "ALL" ? wells.includes(p.well.toLowerCase()) : p.well.toLowerCase() === activeProdWell.toLowerCase();
      return matchWell;
    });
  }

  function getFilteredPressure() {
    const wells = getFilteredWells().map(w => w.name.toLowerCase());
    return window.FIELD_DATA.pressure.filter(p => {
      const matchWell = wells.includes(p.well.toLowerCase());
      const matchField = activeField === "ALL" || p.field.toLowerCase() === activeField.toLowerCase();
      const matchRes = activeReservoir === "ALL" || p.reservoir.toLowerCase().includes(activeReservoir.toLowerCase());
      return matchWell && matchField && matchRes;
    });
  }

  function getFilteredInjection() {
    const wells = getFilteredWells().map(w => w.name.toLowerCase());
    return window.FIELD_DATA.injection.filter(i => {
      const matchWell = i.well === "TOTAL" || wells.includes(i.well.toLowerCase());
      const matchField = activeField === "ALL" || i.field.toLowerCase() === activeField.toLowerCase();
      return matchWell && matchField;
    });
  }

  // Populate Dropdown for Production Wells
  function populateProdWellSelect() {
    const wells = getFilteredWells().filter(w => {
      // Show only wells that actually have production data associated
      return window.FIELD_DATA.production.some(p => p.well.toLowerCase() === w.name.toLowerCase());
    });
    
    // Clear and add default
    const defaultText = currentLang === 'es' ? '-- Mostrar Total del Campo --' : '-- Show Field Total --';
    const currentVal = prodWellSelect.value;
    prodWellSelect.innerHTML = `<option value="ALL">${defaultText}</option>`;
    
    wells.sort((a,b) => (a.name || "").localeCompare(b.name || "")).forEach(w => {
      const opt = document.createElement("option");
      opt.value = w.name;
      const platformText = w.platform || (currentLang === 'es' ? 'Sin Plataforma' : 'No Platform');
      opt.textContent = `${w.name} (${platformText})`;
      prodWellSelect.appendChild(opt);
    });
    
    // Restore value if it still exists
    if (currentVal) {
      prodWellSelect.value = currentVal;
    }
  }

  // Initialize Map
  function initializeMap() {
    if (leafletMap) return;
    
    // Centered in Gulf of Mexico (Ek-Balam Coordinates)
    leafletMap = L.map('map').setView([19.49, -91.98], 11);
    
    lightTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    });
    
    darkTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    });
    
    // Add default tile layer
    if (isDarkMode) {
      darkTileLayer.addTo(leafletMap);
    } else {
      lightTileLayer.addTo(leafletMap);
    }
  }

  // Render Markers on Map
  function updateMapMarkers() {
    if (!leafletMap) return;
    
    // Clear old markers
    activeMapMarkers.forEach(m => leafletMap.removeLayer(m));
    activeMapMarkers = [];
    
    const filteredWells = getFilteredWells().filter(w => w.lat && w.lon);
    
    filteredWells.forEach(w => {
      // Determine colors based on status and type
      let markerColor = '#6b7280'; // Shut in or unknown
      let fillColor = '#9ca3af';
      
      const status = w.status.toLowerCase();
      const type = w.wellType.toLowerCase();
      
      if (status.includes('operat')) {
        if (type.includes('inject')) {
          markerColor = '#00687b'; // Secondary Cyan/Teal
          fillColor = '#50dcff';
        } else {
          markerColor = '#00190d'; // Tertiary Navy/Green
          fillColor = '#65dca4';
        }
      } else if (status.includes('shut') || status.includes('cerrado')) {
        markerColor = '#ba1a1a'; // Risk/Error Red
        fillColor = '#ffdad6';
      }
      
      // Dynamic translations for map popup
      const labels = {
        platform: currentLang === 'es' ? 'PLATAFORMA' : 'PLATFORM',
        equipment: currentLang === 'es' ? 'EQUIPO' : 'RIG',
        reservoir: currentLang === 'es' ? 'YACIMIENTO' : 'RESERVOIR',
        type: currentLang === 'es' ? 'TIPO' : 'TYPE',
        statusLabel: currentLang === 'es' ? 'ESTADO' : 'STATUS',
        depthZ: currentLang === 'es' ? 'PROF. Z' : 'DEPTH Z',
        mdTotal: currentLang === 'es' ? 'MD TOTAL' : 'TOTAL MD',
        note: currentLang === 'es' ? 'NOTA' : 'NOTE',
      };
      
      const translatedType = translateWellType(w.wellType);
      const translatedStatusVal = translateStatus(w.status);
      
      // Popup Content matching Technical Precision style
      const popupContent = `
        <div class="map-popup-title">${w.name}</div>
        <div class="map-popup-row"><span class="map-popup-label">${labels.platform}:</span><span class="map-popup-val">${w.platform || 'N/A'}</span></div>
        <div class="map-popup-row"><span class="map-popup-label">${labels.equipment}:</span><span class="map-popup-val">${w.equipment || 'N/A'}</span></div>
        <div class="map-popup-row"><span class="map-popup-label">${labels.reservoir}:</span><span class="map-popup-val">${w.reservoir || 'N/A'}</span></div>
        <div class="map-popup-row"><span class="map-popup-label">${labels.type}:</span><span class="map-popup-val">${translatedType}</span></div>
        <div class="map-popup-row"><span class="map-popup-label">${labels.statusLabel}:</span><span class="map-popup-val" style="color: ${markerColor}; font-weight:700;">${translatedStatusVal}</span></div>
        <div class="map-popup-row"><span class="map-popup-label">${labels.depthZ}:</span><span class="map-popup-val" style="font-family:var(--font-technical);">${w.z ? w.z + ' m' : 'N/A'}</span></div>
        <div class="map-popup-row"><span class="map-popup-label">${labels.mdTotal}:</span><span class="map-popup-val" style="font-family:var(--font-technical);">${w.md ? w.md + ' m' : 'N/A'}</span></div>
        ${w.comments ? `<div class="map-popup-row" style="margin-top:6px; border-top:1px solid var(--color-border-soft); padding-top:4px;"><span class="map-popup-label">${labels.note}:</span><span class="map-popup-val" style="font-style:italic;">${w.comments}</span></div>` : ''}
      `;
      
      const marker = L.circleMarker([w.lat, w.lon], {
        radius: 7,
        color: markerColor,
        fillColor: fillColor,
        fillOpacity: 0.85,
        weight: 2
      }).bindPopup(popupContent);
      
      marker.addTo(leafletMap);
      activeMapMarkers.push(marker);
    });
  }

  // Render coordinates table
  function renderCoordinatesTable(searchQuery = "") {
    const tbody = document.querySelector("#table-coordinates tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    // Update map markers in sync
    updateMapMarkers();
    
    const query = searchQuery.trim().toLowerCase();
    const wells = getFilteredWells().filter(w => {
      if (!query) return true;
      return w.name.toLowerCase().includes(query) || 
             w.platform.toLowerCase().includes(query) || 
             w.reservoir.toLowerCase().includes(query) ||
             w.status.toLowerCase().includes(query);
    });
    
    if (wells.length === 0) {
      const noResultsText = currentLang === 'es' 
        ? 'No se encontraron pozos que coincidan con la búsqueda.' 
        : 'No wells found matching the search.';
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">${noResultsText}</td></tr>`;
      return;
    }
    
    // Sort alphabetically
    const locateBtnText = currentLang === 'es' ? 'Ubicar' : 'Locate';
    wells.sort((a,b) => (a.name || "").localeCompare(b.name || "")).forEach(w => {
      const tr = document.createElement("tr");
      
      let badgeClass = "badge-unknown";
      const status = w.status.toLowerCase();
      if (status.includes("operat")) {
        badgeClass = w.wellType.toLowerCase().includes("inject") ? "badge-injector" : "badge-operating";
      } else if (status.includes("shut") || status.includes("cerrado")) {
        badgeClass = "badge-shut-in";
      }
      
      const transStatus = translateStatus(w.status);
      
      tr.innerHTML = `
        <td style="font-weight:600; color:var(--color-primary);">${w.name}</td>
        <td>${w.platform || '-'}</td>
        <td>${w.reservoir || '-'}</td>
        <td class="num-col">${w.x ? w.x.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) : '-'}</td>
        <td class="num-col">${w.y ? w.y.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) : '-'}</td>
        <td class="num-col">${w.z ? w.z.toLocaleString() : '-'}</td>
        <td class="num-col">${w.md ? w.md.toLocaleString() : '-'}</td>
        <td><span class="badge ${badgeClass}">${transStatus}</span></td>
        <td>
          <button class="filter-select" style="padding:4px 8px; font-size:11px;" onclick="zoomToWell(${w.lat}, ${w.lon}, '${w.name}')">
            <i class="fa-solid fa-location-crosshairs"></i> ${locateBtnText}
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Global window functions for table button triggers
  window.zoomToWell = (lat, lon, name) => {
    if (!leafletMap || !lat || !lon) return;
    leafletMap.setView([lat, lon], 14);
    // Find marker and trigger popup
    activeMapMarkers.forEach(m => {
      const latlng = m.getLatLng();
      if (Math.abs(latlng.lat - lat) < 0.0001 && Math.abs(latlng.lng - lon) < 0.0001) {
        m.openPopup();
      }
    });
    // Scroll map container into view
    document.getElementById("map").scrollIntoView({ behavior: 'smooth' });
  };


  // 1. DASHBOARD VIEW CONTROLLER
  function updateDashboardView() {
    const wells = getFilteredWells();
    const prod = getFilteredProduction();
    
    // Set KPIs with translation for unit
    const wellUnit = currentLang === 'es' ? 'pozos' : 'wells';
    document.getElementById("kpi-dash-wells").innerHTML = `${wells.length} <span class="kpi-unit">${wellUnit}</span>`;
    
    // ESP Wells Count with translation
    const activeESPs = wells.filter(w => w.espInstalled === "Y" && w.status.toLowerCase().includes("operat"));
    const espUnit = currentLang === 'es' ? 'activas' : 'active';
    document.getElementById("kpi-dash-esp").innerHTML = `${activeESPs.length} <span class="kpi-unit">${espUnit}</span>`;
    
    // Active states counts
    const stateOper = wells.filter(w => w.status.toLowerCase().includes("operat") && !w.wellType.toLowerCase().includes("inject")).length;
    const stateShut = wells.filter(w => w.status.toLowerCase().includes("shut") || w.status.toLowerCase().includes("cerrado")).length;
    const stateInj = wells.filter(w => w.status.toLowerCase().includes("inject") || w.wellType.toLowerCase().includes("inject")).length;
    
    document.getElementById("dash-state-oper").textContent = stateOper;
    document.getElementById("dash-state-shut").textContent = stateShut;
    document.getElementById("dash-state-inj").textContent = stateInj;

    // Calculate Average Production (Recent)
    const prodByDate = {};
    prod.forEach(p => {
      if (!prodByDate[p.date]) {
        prodByDate[p.date] = { oil: 0, gas: 0, wtr: 0 };
      }
      prodByDate[p.date].oil += p.oil_bpd;
      prodByDate[p.date].gas += p.gas_mmscfd;
      prodByDate[p.date].wtr += p.wtr_bpd;
    });
    
    const dates = Object.keys(prodByDate).sort();
    if (dates.length > 0) {
      // Recent average (over the last 12 months in the series)
      const recentDates = dates.slice(-12);
      const avgOil = recentDates.reduce((acc, d) => acc + prodByDate[d].oil, 0) / recentDates.length;
      const avgGas = recentDates.reduce((acc, d) => acc + prodByDate[d].gas, 0) / recentDates.length;
      
      document.getElementById("kpi-dash-oil").innerHTML = `${Math.round(avgOil).toLocaleString()} <span class="kpi-unit">bopd</span>`;
      document.getElementById("kpi-dash-gas").innerHTML = `${avgGas.toFixed(2)} <span class="kpi-unit">MMscfd</span>`;
      
      // Render Dashboard Production Chart
      renderDashboardProductionChart(prodByDate, dates);
    } else {
      document.getElementById("kpi-dash-oil").innerHTML = `0 <span class="kpi-unit">bopd</span>`;
      document.getElementById("kpi-dash-gas").innerHTML = `0 <span class="kpi-unit">MMscfd</span>`;
      if (dashProdChart) { dashProdChart.destroy(); dashProdChart = null; }
    }
    
    // Well Type Donut Chart
    renderDashboardWellTypeChart(stateOper, stateInj, stateShut);
  }

  function renderDashboardProductionChart(prodByDate, sortedDates) {
    const oilData = sortedDates.map(d => Math.round(prodByDate[d].oil));
    const gasData = sortedDates.map(d => parseFloat(prodByDate[d].gas.toFixed(1)));
    const wtrData = sortedDates.map(d => Math.round(prodByDate[d].wtr));
    
    // Colors from DESIGN.md
    const colors = isDarkMode 
      ? ['#8ab4f8', '#adc1e6', '#e06666']
      : ['#001529', '#00B8D9', '#bf2600'];

    const oilSeriesName = currentLang === 'es' ? "Crudo (bopd)" : "Crude (bopd)";
    const gasSeriesName = currentLang === 'es' ? "Gas (MMscfd)" : "Gas (MMscfd)";
    const wtrSeriesName = currentLang === 'es' ? "Agua (bwpd)" : "Water (bwpd)";
    const yaxisLeftTitle = currentLang === 'es' ? "Aceite & Agua (bpd)" : "Oil & Water (bpd)";
    const yaxisRightTitle = currentLang === 'es' ? "Gas Natural (MMscfd)" : "Natural Gas (MMscfd)";

    const options = {
      series: [
        { name: oilSeriesName, type: "area", data: oilData },
        { name: gasSeriesName, type: "line", data: gasData },
        { name: wtrSeriesName, type: "area", data: wtrData }
      ],
      chart: {
        height: 320,
        type: "line",
        stacked: false,
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false },
        background: 'transparent'
      },
      colors: colors,
      stroke: {
        width: [2, 3, 2],
        curve: "smooth"
      },
      fill: {
        opacity: [0.1, 1, 0.05],
        type: ['solid', 'solid', 'solid']
      },
      xaxis: {
        categories: sortedDates,
        type: 'datetime',
        labels: {
          style: {
            colors: isDarkMode ? '#8a99ad' : '#74777e',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px'
          }
        }
      },
      yaxis: [
        {
          seriesName: oilSeriesName,
          axisTicks: { show: true },
          axisBorder: { show: true, color: colors[0] },
          labels: {
            style: { colors: colors[0] },
            formatter: (v) => Math.round(v).toLocaleString()
          },
          title: { text: yaxisLeftTitle, style: { color: colors[0] } }
        },
        {
          seriesName: gasSeriesName,
          opposite: true,
          axisTicks: { show: true },
          axisBorder: { show: true, color: colors[1] },
          labels: {
            style: { colors: colors[1] },
            formatter: (v) => v.toFixed(1)
          },
          title: { text: yaxisRightTitle, style: { color: colors[1] } }
        }
      ],
      tooltip: {
        shared: true,
        intersect: false,
        theme: isDarkMode ? 'dark' : 'light',
        x: { format: 'MMM yyyy' }
      },
      legend: {
        position: 'bottom',
        labels: { colors: isDarkMode ? '#c3cbde' : '#101c2d' }
      },
      grid: {
        borderColor: isDarkMode ? '#2e3b52' : '#dfe1e6',
        strokeDashArray: 2
      },
      theme: { mode: isDarkMode ? 'dark' : 'light' }
    };

    if (dashProdChart) {
      dashProdChart.updateOptions(options);
    } else {
      dashProdChart = new ApexCharts(document.getElementById("chart-dash-prod"), options);
      dashProdChart.render();
    }
  }

  function renderDashboardWellTypeChart(producers, injectors, shutIn) {
    const colors = ['#65dca4', '#50dcff', '#ffdad6']; // Emerald, Cyan, Red
    const labels = currentLang === 'es' 
      ? ["Productor", "Inyector", "Shut-in"] 
      : ["Producer", "Injector", "Shut-in"];

    const options = {
      series: [producers, injectors, shutIn],
      labels: labels,
      chart: {
        type: 'donut',
        height: 240,
        fontFamily: 'Inter, sans-serif',
        background: 'transparent'
      },
      colors: colors,
      stroke: { show: false },
      dataLabels: { enabled: false },
      legend: { show: false },
      tooltip: { theme: isDarkMode ? 'dark' : 'light' },
      plotOptions: {
        pie: {
          donut: {
            size: '75%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                formatter: function (w) {
                  return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                },
                style: {
                  color: isDarkMode ? '#f0f4fa' : '#101c2d',
                  fontSize: '18px',
                  fontWeight: '700'
                }
              }
            }
          }
        }
      }
    };

    if (dashWellTypeChart) {
      dashWellTypeChart.updateOptions(options);
    } else {
      dashWellTypeChart = new ApexCharts(document.getElementById("chart-dash-welltype"), options);
      dashWellTypeChart.render();
    }
  }


  // 2. PRODUCTION VIEW CONTROLLER
  function updateProductionView() {
    const prod = getFilteredProduction();
    
    // Group by Date to get averages/totals
    const prodByDate = {};
    let totalOilVol = 0;
    let totalWtrVol = 0;
    let totalGasVol = 0;
    
    prod.forEach(p => {
      if (!prodByDate[p.date]) {
        prodByDate[p.date] = { oil: 0, gas: 0, wtr: 0 };
      }
      prodByDate[p.date].oil += p.oil_bpd;
      prodByDate[p.date].gas += p.gas_mmscfd;
      prodByDate[p.date].wtr += p.wtr_bpd;
    });
    
    const sortedDates = Object.keys(prodByDate).sort();
    
    if (sortedDates.length > 0) {
      // Recent Average
      const recentDates = sortedDates.slice(-12);
      const avgOil = recentDates.reduce((acc, d) => acc + prodByDate[d].oil, 0) / recentDates.length;
      const avgWtr = recentDates.reduce((acc, d) => acc + prodByDate[d].wtr, 0) / recentDates.length;
      const avgGas = recentDates.reduce((acc, d) => acc + prodByDate[d].gas, 0) / recentDates.length;
      
      const totalLiq = avgOil + avgWtr;
      const wc = totalLiq > 0 ? (avgWtr / totalLiq * 100) : 0;
      
      document.getElementById("kpi-prod-oil").innerHTML = `${Math.round(avgOil).toLocaleString()} <span class="kpi-unit">bopd</span>`;
      document.getElementById("kpi-prod-wtr").innerHTML = `${Math.round(avgWtr).toLocaleString()} <span class="kpi-unit">bwpd</span>`;
      document.getElementById("kpi-prod-wc").innerHTML = `${wc.toFixed(1)} <span class="kpi-unit">%</span>`;
      document.getElementById("kpi-prod-gas").innerHTML = `${avgGas.toFixed(2)} <span class="kpi-unit">MMscfd</span>`;
      
      // Render Charts
      renderProductionHistoryChart(prodByDate, sortedDates);
      renderProductionWcChart(prodByDate, sortedDates);
    } else {
      document.getElementById("kpi-prod-oil").innerHTML = `0 <span class="kpi-unit">bopd</span>`;
      document.getElementById("kpi-prod-wtr").innerHTML = `0 <span class="kpi-unit">bwpd</span>`;
      document.getElementById("kpi-prod-wc").innerHTML = `0.0 <span class="kpi-unit">%</span>`;
      document.getElementById("kpi-prod-gas").innerHTML = `0.0 <span class="kpi-unit">MMscfd</span>`;
      if (prodHistoryChart) { prodHistoryChart.destroy(); prodHistoryChart = null; }
      if (prodWcChart) { prodWcChart.destroy(); prodWcChart = null; }
    }
  }

  function renderProductionHistoryChart(prodByDate, sortedDates) {
    const oil = sortedDates.map(d => Math.round(prodByDate[d].oil));
    const gas = sortedDates.map(d => parseFloat(prodByDate[d].gas.toFixed(1)));
    const wtr = sortedDates.map(d => Math.round(prodByDate[d].wtr));
    
    const colors = isDarkMode 
      ? ['#8ab4f8', '#adc1e6', '#e06666']
      : ['#0f2a43', '#00B8D9', '#bf2600'];

    const oilSeriesName = currentLang === 'es' ? "Crudo (bopd)" : "Crude (bopd)";
    const gasSeriesName = currentLang === 'es' ? "Gas (MMscfd)" : "Gas (MMscfd)";
    const wtrSeriesName = currentLang === 'es' ? "Agua (bwpd)" : "Water (bwpd)";
    const yaxisLeftTitle = currentLang === 'es' ? "Aceite & Agua (bpd)" : "Oil & Water (bpd)";
    const yaxisRightTitle = currentLang === 'es' ? "Gas (MMscfd)" : "Gas (MMscfd)";

    const options = {
      series: [
        { name: oilSeriesName, type: "area", data: oil },
        { name: gasSeriesName, type: "line", data: gas },
        { name: wtrSeriesName, type: "line", data: wtr }
      ],
      chart: {
        height: 320,
        type: "line",
        stacked: false,
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false },
        background: 'transparent'
      },
      colors: colors,
      stroke: {
        width: [2, 3, 2],
        curve: "smooth"
      },
      fill: {
        opacity: [0.1, 1, 0.05],
        type: ['solid', 'solid', 'solid']
      },
      xaxis: {
        categories: sortedDates,
        type: 'datetime',
        labels: {
          style: {
            colors: isDarkMode ? '#8a99ad' : '#74777e',
            fontFamily: 'JetBrains Mono, monospace'
          }
        }
      },
      yaxis: [
        {
          seriesName: oilSeriesName,
          axisTicks: { show: true },
          axisBorder: { show: true, color: colors[0] },
          labels: { style: { colors: colors[0] } },
          title: { text: yaxisLeftTitle, style: { color: colors[0] } }
        },
        {
          seriesName: gasSeriesName,
          opposite: true,
          axisTicks: { show: true },
          axisBorder: { show: true, color: colors[1] },
          labels: { style: { colors: colors[1] } },
          title: { text: yaxisRightTitle, style: { color: colors[1] } }
        }
      ],
      tooltip: {
        shared: true,
        intersect: false,
        theme: isDarkMode ? 'dark' : 'light'
      },
      legend: {
        position: 'bottom',
        labels: { colors: isDarkMode ? '#c3cbde' : '#101c2d' }
      },
      grid: {
        borderColor: isDarkMode ? '#2e3b52' : '#dfe1e6',
        strokeDashArray: 2
      }
    };

    if (prodHistoryChart) {
      prodHistoryChart.updateOptions(options);
    } else {
      prodHistoryChart = new ApexCharts(document.getElementById("chart-prod-history"), options);
      prodHistoryChart.render();
    }
  }

  function renderProductionWcChart(prodByDate, sortedDates) {
    const wcData = sortedDates.map(d => {
      const o = prodByDate[d].oil;
      const w = prodByDate[d].wtr;
      return o + w > 0 ? parseFloat((w / (o + w) * 100).toFixed(1)) : 0;
    });

    const color = '#36B37E'; // Emerald / Safe zone
    const seriesName = currentLang === 'es' ? "Corte de Agua (Water Cut)" : "Water Cut";
    const yaxisTitle = currentLang === 'es' ? "Water Cut (%)" : "Water Cut (%)";
    
    const options = {
      series: [
        { name: seriesName, data: wcData }
      ],
      chart: {
        height: 320,
        type: "area",
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false },
        background: 'transparent'
      },
      colors: [color],
      stroke: {
        width: 2,
        curve: "smooth"
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.3,
          opacityTo: 0.05
        }
      },
      xaxis: {
        categories: sortedDates,
        type: 'datetime',
        labels: {
          style: {
            colors: isDarkMode ? '#8a99ad' : '#74777e',
            fontFamily: 'JetBrains Mono, monospace'
          }
        }
      },
      yaxis: {
        max: 100,
        min: 0,
        labels: {
          formatter: (v) => `${v}%`,
          style: { colors: isDarkMode ? '#8a99ad' : '#74777e' }
        },
        title: { text: yaxisTitle, style: { color: color } }
      },
      tooltip: {
        theme: isDarkMode ? 'dark' : 'light',
        x: { format: 'MMM yyyy' }
      },
      grid: {
        borderColor: isDarkMode ? '#2e3b52' : '#dfe1e6',
        strokeDashArray: 2
      }
    };

    if (prodWcChart) {
      prodWcChart.updateOptions(options);
    } else {
      prodWcChart = new ApexCharts(document.getElementById("chart-prod-wc"), options);
      prodWcChart.render();
    }
  }


  // 3. PRESSURE VIEW CONTROLLER
  function updatePressureView() {
    const press = getFilteredPressure();
    const tbody = document.querySelector("#table-pressure tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    if (press.length === 0) {
      const emptyMsg = currentLang === 'es' 
        ? 'No se registraron presiones para el filtro activo.' 
        : 'No pressures recorded for the active filter.';
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">${emptyMsg}</td></tr>`;
      document.getElementById("kpi-pres-initial").innerHTML = `- <span class="kpi-unit">kg/cm²</span>`;
      document.getElementById("kpi-pres-recent").innerHTML = `- <span class="kpi-unit">kg/cm²</span>`;
      document.getElementById("kpi-pres-loss").innerHTML = `- <span class="kpi-unit">kg/cm²</span>`;
      if (pressureDeclineChart) { pressureDeclineChart.destroy(); pressureDeclineChart = null; }
      return;
    }
    
    // Sort chronologically
    press.sort((a,b) => (a.date || "").localeCompare(b.date || ""));
    
    // Populate pressure table
    press.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="font-family:var(--font-technical);">${p.date}</td>
        <td style="font-weight:600; color:var(--color-primary);">${p.well}</td>
        <td>${p.field}</td>
        <td>${p.reservoir}</td>
        <td class="num-col">${p.pws_kgcm2 ? p.pws_kgcm2.toFixed(1) : '-'}</td>
        <td class="num-col">${p.pws_psi ? Math.round(p.pws_psi).toLocaleString() : '-'}</td>
        <td>${translateDbText(p.comments)}</td>
      `;
      tbody.appendChild(tr);
    });
    
    // Calculate KPIs
    const initialPress = press[0].pws_kgcm2;
    // Find recent minimum pressure
    const recentPressures = press.slice(-5).map(p => p.pws_kgcm2).filter(p => p !== null);
    const recentPress = recentPressures.length > 0 ? Math.min(...recentPressures) : initialPress;
    const loss = (initialPress && recentPress) ? (initialPress - recentPress) : 0;
    
    document.getElementById("kpi-pres-initial").innerHTML = `${initialPress ? initialPress.toFixed(1) : '-'} <span class="kpi-unit">kg/cm²</span>`;
    document.getElementById("kpi-pres-recent").innerHTML = `${recentPress ? recentPress.toFixed(1) : '-'} <span class="kpi-unit">kg/cm²</span>`;
    document.getElementById("kpi-pres-loss").innerHTML = `${loss.toFixed(1)} <span class="kpi-unit">kg/cm²</span>`;
    
    // Render Decline Chart
    renderPressureDeclineChart(press);
  }

  function renderPressureDeclineChart(pressData) {
    // Group pressure points by reservoir to show separate depletion trends
    const reservoirSeries = {};
    pressData.forEach(p => {
      const res = p.reservoir;
      if (!reservoirSeries[res]) {
        reservoirSeries[res] = [];
      }
      reservoirSeries[res].push({
        x: new Date(p.date).getTime(),
        y: p.pws_kgcm2
      });
    });
    
    const series = Object.keys(reservoirSeries).map(res => {
      return {
        name: res,
        data: reservoirSeries[res].sort((a,b) => a.x - b.x)
      };
    });

    const xaxisTitle = currentLang === 'es' ? "Fecha" : "Date";
    const yaxisTitle = currentLang === 'es' ? "Presión Pws (kg/cm²)" : "Pws Pressure (kg/cm²)";

    const options = {
      series: series,
      chart: {
        height: 380,
        type: "scatter",
        zoom: { enabled: true, type: 'xy' },
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: true },
        background: 'transparent'
      },
      markers: {
        size: 6,
        strokeWidth: 1,
        hover: { size: 8 }
      },
      xaxis: {
        type: 'datetime',
        labels: {
          style: {
            colors: isDarkMode ? '#8a99ad' : '#74777e',
            fontFamily: 'JetBrains Mono, monospace'
          }
        },
        title: { text: xaxisTitle, style: { color: isDarkMode ? '#f0f4fa' : '#101c2d' } }
      },
      yaxis: {
        title: { text: yaxisTitle, style: { color: isDarkMode ? '#f0f4fa' : '#101c2d' } },
        labels: {
          style: { colors: isDarkMode ? '#8a99ad' : '#74777e' }
        }
      },
      tooltip: {
        theme: isDarkMode ? 'dark' : 'light',
        x: { format: 'dd MMM yyyy' }
      },
      legend: {
        position: 'bottom',
        labels: { colors: isDarkMode ? '#c3cbde' : '#101c2d' }
      },
      grid: {
        borderColor: isDarkMode ? '#2e3b52' : '#dfe1e6',
        strokeDashArray: 2
      }
    };

    if (pressureDeclineChart) {
      pressureDeclineChart.updateOptions(options);
    } else {
      pressureDeclineChart = new ApexCharts(document.getElementById("chart-pressure-decline"), options);
      pressureDeclineChart.render();
    }
  }


  // 4. WATER INJECTION VIEW CONTROLLER
  function updateInjectionView() {
    const inj = getFilteredInjection();
    const diag = window.FIELD_DATA.water_diagnostics;
    
    const tbody = document.querySelector("#table-water-diagnostics tbody");
    if (tbody) {
      tbody.innerHTML = "";
      diag.forEach(d => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td style="font-weight:600; color:var(--color-primary);">${d.well}</td>
          <td class="num-col">${d.liq_rate_mbd ? d.liq_rate_mbd.toFixed(1) : '-'}</td>
          <td class="num-col">${d.oil_rate_mbd ? d.oil_rate_mbd.toFixed(1) : '-'}</td>
          <td class="num-col">${d.wtr_rate_mbd ? d.wtr_rate_mbd.toFixed(1) : '-'}</td>
          <td class="num-col">${d.critical_oil_rate_mbd ? d.critical_oil_rate_mbd.toFixed(1) : '-'}</td>
          <td style="color:var(--color-error); font-weight:600;">${translateDbText(d.diagnostic)}</td>
          <td>${translateDbText(d.proposal)}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    const wellUnit = currentLang === 'es' ? 'pozos' : 'wells';

    if (inj.length === 0) {
      document.getElementById("kpi-inj-count").innerHTML = `0 <span class="kpi-unit">${wellUnit}</span>`;
      document.getElementById("kpi-inj-rate").innerHTML = `0 <span class="kpi-unit">bwpd</span>`;
      document.getElementById("kpi-inj-cum").innerHTML = `0.0 <span class="kpi-unit">MMbbl</span>`;
      if (injectionChart) { injectionChart.destroy(); injectionChart = null; }
      return;
    }
    
    // Group injection by well and date
    const injByDate = {};
    const injectorsList = new Set();
    
    inj.forEach(i => {
      if (i.well === "TOTAL") return; // skip total summaries
      injectorsList.add(i.well);
      
      if (!injByDate[i.date]) {
        injByDate[i.date] = {};
      }
      injByDate[i.date][i.well] = i.rate_bwpd;
    });
    
    const sortedDates = Object.keys(injByDate).sort();
    
    // Calculate KPIs
    const injectorCount = injectorsList.size;
    let recentTotalRate = 0;
    let cumVolume = 0;
    
    sortedDates.forEach(d => {
      let dateTotal = 0;
      Object.keys(injByDate[d]).forEach(well => {
        const r = injByDate[d][well];
        dateTotal += r;
        // Estimate cum volume (rate in bpd * 30 days)
        cumVolume += (r * 30.4);
      });
      recentTotalRate = dateTotal; // keep last
    });
    
    document.getElementById("kpi-inj-count").innerHTML = `${injectorCount} <span class="kpi-unit">${wellUnit}</span>`;
    document.getElementById("kpi-inj-rate").innerHTML = `${Math.round(recentTotalRate).toLocaleString()} <span class="kpi-unit">bwpd</span>`;
    document.getElementById("kpi-inj-cum").innerHTML = `${(cumVolume / 1000000).toFixed(1)} <span class="kpi-unit">MMbbl</span>`;
    
    // Render injection timeline chart
    renderWaterInjectionChart(injByDate, sortedDates, Array.from(injectorsList));
  }

  function renderWaterInjectionChart(injByDate, sortedDates, injectors) {
    const series = injectors.map(well => {
      const data = sortedDates.map(d => {
        return {
          x: new Date(d).getTime(),
          y: injByDate[d][well] || 0
        };
      });
      return {
        name: well,
        data: data
      };
    });

    const yaxisTitle = currentLang === 'es' ? "Tasa de Inyección (bwpd)" : "Injection Rate (bwpd)";

    const options = {
      series: series,
      chart: {
        height: 350,
        type: "area",
        stacked: true,
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false },
        background: 'transparent'
      },
      stroke: { curve: "smooth", width: 2 },
      fill: {
        type: 'solid',
        opacity: 0.15
      },
      xaxis: {
        type: 'datetime',
        labels: {
          style: {
            colors: isDarkMode ? '#8a99ad' : '#74777e',
            fontFamily: 'JetBrains Mono, monospace'
          }
        }
      },
      yaxis: {
        labels: {
          formatter: (v) => Math.round(v).toLocaleString(),
          style: { colors: isDarkMode ? '#8a99ad' : '#74777e' }
        },
        title: { text: yaxisTitle, style: { color: isDarkMode ? '#f0f4fa' : '#101c2d' } }
      },
      tooltip: {
        theme: isDarkMode ? 'dark' : 'light',
        x: { format: 'MMM yyyy' }
      },
      legend: {
        position: 'bottom',
        labels: { colors: isDarkMode ? '#c3cbde' : '#101c2d' }
      },
      grid: {
        borderColor: isDarkMode ? '#2e3b52' : '#dfe1e6',
        strokeDashArray: 2
      }
    };

    if (injectionChart) {
      injectionChart.updateOptions(options);
    } else {
      injectionChart = new ApexCharts(document.getElementById("chart-injection-history"), options);
      injectionChart.render();
    }
  }


  // 5. ESP (BEC) VIEW CONTROLLER
  function updateEspView() {
    const wells = getFilteredWells();
    const esps = window.FIELD_DATA.esp.filter(e => {
      // Find matching well in current filtered list
      return wells.some(w => w.name.toLowerCase() === e.well.toLowerCase());
    });
    
    // Render ESP parameter table
    const tbody = document.querySelector("#table-esp-params tbody");
    if (tbody) {
      tbody.innerHTML = "";
      
      if (esps.length === 0) {
        const emptyMsg = currentLang === 'es'
          ? 'No hay registros de bombas BEC para el filtro activo.'
          : 'No ESP pump records for the active filter.';
        tbody.innerHTML = `<tr><td colspan="13" style="text-align:center;">${emptyMsg}</td></tr>`;
      } else {
        esps.forEach(e => {
          const tr = document.createElement("tr");
          
          // Format Megger test date
          const date = e.last_megger_date || '-';
          const sensorText = e.sensor_operating === 'Sí' ? (currentLang === 'es' ? 'Sí' : 'Yes') : (currentLang === 'es' ? 'No' : 'No');
          
          tr.innerHTML = `
            <td style="font-weight:500;">${e.platform}</td>
            <td style="font-weight:600; color:var(--color-primary);">${e.well}</td>
            <td class="num-col">${e.oil_bpd ? e.oil_bpd.toLocaleString() : '-'}</td>
            <td class="num-col">${e.frequency_hz ? e.frequency_hz.toFixed(1) : '-'}</td>
            <td class="num-col">${e.current_a}</td>
            <td class="num-col">${e.current_b}</td>
            <td class="num-col">${e.current_c}</td>
            <td class="num-col" style="font-family:var(--font-technical);">${e.insulation_mohm}</td>
            <td class="num-col" style="font-family:var(--font-technical);">${e.phase_to_phase_ohm}</td>
            <td>${e.vfd_brand || '-'}</td>
            <td style="font-family:var(--font-technical);">${date}</td>
            <td class="num-col">${e.motor_temp_c}</td>
            <td>${sensorText}</td>
          `;
          tbody.appendChild(tr);
        });
      }
    }
    
    // ESP KPIs
    const activeCount = esps.filter(e => e.frequency_hz > 0).length;
    const avgFreq = activeCount > 0 ? esps.reduce((acc, e) => acc + (e.frequency_hz || 0), 0) / activeCount : 0;
    const failedSensors = esps.filter(e => e.sensor_operating.toLowerCase().includes("no")).length;
    
    const activeUnit = currentLang === 'es' ? 'operando' : 'operating';
    const inactiveUnit = currentLang === 'es' ? 'inactivos' : 'inactive';

    document.getElementById("kpi-esp-active").innerHTML = `${activeCount} <span class="kpi-unit">${activeUnit}</span>`;
    document.getElementById("kpi-esp-freq").innerHTML = `${avgFreq.toFixed(1)} <span class="kpi-unit">Hz</span>`;
    document.getElementById("kpi-esp-sensor").innerHTML = `${failedSensors} <span class="kpi-unit">${inactiveUnit}</span>`;

    // Render Workover Timeline
    renderEspWorkoverTimeline();
    
    // Render ESP historical costs
    renderEspCostsTable();
  }

  function renderEspWorkoverTimeline() {
    const container = document.getElementById("esp-timeline-container");
    if (!container) return;
    container.innerHTML = "";
    
    const sched = window.FIELD_DATA.esp_workover_schedule;
    if (sched.length === 0) {
      const emptyMsg = currentLang === 'es' ? 'No hay cronograma disponible.' : 'No schedule available.';
      container.innerHTML = `<div style="text-align:center; padding:20px;">${emptyMsg}</div>`;
      return;
    }
    
    const totalDays = sched.reduce((acc, s) => acc + s.days, 0);
    
    const htmlList = document.createElement("div");
    htmlList.className = "timeline-list";
    
    const daysUnit = currentLang === 'es' ? 'días' : 'days';

    sched.forEach(s => {
      const item = document.createElement("div");
      item.className = "timeline-item";
      
      const widthPct = (s.days / totalDays) * 100;
      
      item.innerHTML = `
        <div class="timeline-activity">${translateActivity(s.activity)}</div>
        <div class="timeline-bar-bg" title="${s.days} ${daysUnit} (${widthPct.toFixed(1)}%)">
          <div class="timeline-bar-fill" style="width: ${widthPct}%;"></div>
        </div>
        <div class="timeline-days">${s.days.toFixed(2)} d</div>
      `;
      htmlList.appendChild(item);
    });
    
    // Add total row
    const totalDiv = document.createElement("div");
    totalDiv.style = "margin-top:16px; border-top:1px solid var(--color-border-soft); padding-top:10px; display:flex; justify-content:space-between; font-weight:700; font-family:var(--font-technical); font-size:14px;";
    
    const labelTotal = currentLang === 'es' ? 'DURACIÓN TOTAL PROGRAMADA:' : 'TOTAL SCHEDULED DURATION:';
    const daysWord = currentLang === 'es' ? 'DÍAS' : 'DAYS';
    totalDiv.innerHTML = `<span>${labelTotal}</span><span>${totalDays.toFixed(2)} ${daysWord}</span>`;
    
    container.appendChild(htmlList);
    container.appendChild(totalDiv);
  }

  function renderEspCostsTable() {
    const tbody = document.querySelector("#table-esp-costs tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    const wells = getFilteredWells().map(w => w.name.toLowerCase());
    const costs = window.FIELD_DATA.esp_historical_costs.filter(c => {
      return wells.includes(c.well.toLowerCase());
    });
    
    if (costs.length === 0) {
      const emptyMsg = currentLang === 'es'
        ? 'No hay registros de costos históricos para los pozos activos.'
        : 'No historical cost records for active wells.';
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">${emptyMsg}</td></tr>`;
      return;
    }
    
    // Sort by date descending
    costs.sort((a,b) => (b.date || "").localeCompare(a.date || "")).forEach(c => {
      const tr = document.createElement("tr");
      const eqText = translateEquipmentType(c.equipment_type) || (currentLang === 'es' ? 'BEC Reemplazo' : 'Replacement ESP');
      tr.innerHTML = `
        <td style="font-family:var(--font-technical);">${c.date}</td>
        <td style="font-weight:600; color:var(--color-primary);">${c.well}</td>
        <td>${eqText}</td>
        <td class="num-col">${c.cost_mxn_mm ? c.cost_mxn_mm.toFixed(1) : '-'}</td>
        <td class="num-col" style="font-weight:600;">${c.cost_usd_mm ? '$' + c.cost_usd_mm.toFixed(2) + 'M' : '-'}</td>
      `;
      tbody.appendChild(tr);
    });
  }


  // 6. CHEMICAL VIEW CONTROLLER
  function updateChemicalView() {
    // Platform Chemicals Table
    const tbodyA = document.querySelector("#table-chemical-a tbody");
    if (tbodyA) {
      tbodyA.innerHTML = "";
      const chemA = window.FIELD_DATA.chemical_treatment.filter(c => c.section === "A");
      
      chemA.forEach(c => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td style="font-weight:500;">${c.platform_system}</td>
          <td>${translateChemical(c.chemical_type)}</td>
          <td style="font-weight:600; color:var(--color-secondary);">${c.product_name}</td>
          <td>${c.supplier}</td>
          <td>${translateChemical(c.injection_point)}</td>
          <td>${translateChemical(c.treatment_mode)}</td>
          <td class="num-col">${c.dose_rate_ppm || '-'}</td>
          <td class="num-col">${c.dose_rate_l_day || '-'}</td>
          <td class="num-col">${c.target_conc_ppm || '-'}</td>
          <td>${translateChemical(c.sampled_verified)}</td>
          <td style="font-family:var(--font-technical);">${c.last_review_date || '-'}</td>
          <td class="num-col" style="font-weight:700;">${c.effectiveness || '-'}</td>
        `;
        tbodyA.appendChild(tr);
      });
    }
    
    // Downhole Chemicals Table
    const tbodyB = document.querySelector("#table-chemical-b tbody");
    if (tbodyB) {
      tbodyB.innerHTML = "";
      const chemB = window.FIELD_DATA.chemical_treatment.filter(c => c.section === "B");
      
      if (chemB.length === 0) {
        const emptyMsg = currentLang === 'es'
          ? 'No hay registros de dosificación individual de pozos. Se inyecta por capilaridad a demanda.'
          : 'No individual well dosage records. Dosed via capillary on demand.';
        tbodyB.innerHTML = `<tr><td colspan="12" style="text-align:center;">${emptyMsg}</td></tr>`;
      } else {
        chemB.forEach(c => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td style="font-weight:500;">${c.platform_system}</td>
            <td>${translateChemical(c.chemical_type)}</td>
            <td style="font-weight:600; color:var(--color-secondary);">${c.product_name}</td>
            <td>${c.supplier}</td>
            <td>${translateChemical(c.injection_point)}</td>
            <td>${translateChemical(c.treatment_mode)}</td>
            <td class="num-col">${c.dose_rate_ppm || '-'}</td>
            <td class="num-col">${c.dose_rate_l_day || '-'}</td>
            <td class="num-col">${c.target_conc_ppm || '-'}</td>
            <td>${translateChemical(c.sampled_verified)}</td>
            <td style="font-family:var(--font-technical);">${c.last_review_date || '-'}</td>
            <td class="num-col" style="font-weight:700;">${c.effectiveness || '-'}</td>
          `;
          tbodyB.appendChild(tr);
        });
      }
    }
  }


  // 7. DRILLING & COSTS VIEW CONTROLLER
  function updateDcView() {
    const wells = getFilteredWells().map(w => w.name.toLowerCase());
    const dc = window.FIELD_DATA.historical_dc.filter(d => {
      return wells.includes(d.well.toLowerCase());
    });
    
    const tbody = document.querySelector("#table-dc tbody");
    const daysUnit = currentLang === 'es' ? 'días' : 'days';

    if (tbody) {
      tbody.innerHTML = "";
      
      if (dc.length === 0) {
        const emptyMsg = currentLang === 'es'
          ? 'No hay registros de perforación para los pozos activos.'
          : 'No drilling records for active wells.';
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">${emptyMsg}</td></tr>`;
        document.getElementById("kpi-dc-drill").innerHTML = `- <span class="kpi-unit">${daysUnit}</span>`;
        document.getElementById("kpi-dc-complete").innerHTML = `- <span class="kpi-unit">${daysUnit}</span>`;
        document.getElementById("kpi-dc-cost").innerHTML = `- <span class="kpi-unit">USD MM</span>`;
        if (dcDaysChart) { dcDaysChart.destroy(); dcDaysChart = null; }
        return;
      }
      
      dc.sort((a,b) => (b.date || "").localeCompare(a.date || "")).forEach(d => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td style="font-family:var(--font-technical);">${d.date}</td>
          <td style="font-weight:600; color:var(--color-primary);">${d.well}</td>
          <td>${d.rig || '-'}</td>
          <td>${translateRigType(d.platform_type)}</td>
          <td class="num-col">${d.drilling_days || '-'}</td>
          <td class="num-col">${d.completion_days || '-'}</td>
          <td class="num-col">${d.cost_mxn_mm ? d.cost_mxn_mm.toFixed(1) : '-'}</td>
          <td class="num-col">${d.exchange_rate || '-'}</td>
          <td class="num-col" style="font-weight:600;">${d.cost_usd_mm ? '$' + d.cost_usd_mm.toFixed(2) + 'M' : '-'}</td>
        `;
        tbody.appendChild(tr);
      });
    }
    
    // Calculate KPIs
    const validDrill = dc.map(d => d.drilling_days).filter(d => d !== null && d > 0);
    const validComp = dc.map(d => d.completion_days).filter(d => d !== null && d > 0);
    const validCost = dc.map(d => d.cost_usd_mm).filter(d => d !== null && d > 0);
    
    const avgDrill = validDrill.length > 0 ? validDrill.reduce((a,b) => a+b, 0) / validDrill.length : 0;
    const avgComp = validComp.length > 0 ? validComp.reduce((a,b) => a+b, 0) / validComp.length : 0;
    const avgCost = validCost.length > 0 ? validCost.reduce((a,b) => a+b, 0) / validCost.length : 0;
    
    document.getElementById("kpi-dc-drill").innerHTML = `${Math.round(avgDrill)} <span class="kpi-unit">${daysUnit}</span>`;
    document.getElementById("kpi-dc-complete").innerHTML = `${Math.round(avgComp)} <span class="kpi-unit">${daysUnit}</span>`;
    document.getElementById("kpi-dc-cost").innerHTML = `${avgCost ? '$' + avgCost.toFixed(2) + 'M' : '-'} <span class="kpi-unit">USD</span>`;
    
    // Render Bar chart for Drilling & Completion Days
    renderDcDaysChart(dc);
  }

  function renderDcDaysChart(dcData) {
    // Show top 25 wells by drilling days for visibility
    const sortedData = [...dcData]
      .filter(d => d.drilling_days || d.completion_days)
      .sort((a,b) => (b.drilling_days || 0) - (a.drilling_days || 0))
      .slice(0, 25);
      
    const categories = sortedData.map(d => d.well);
    const drillDays = sortedData.map(d => d.drilling_days || 0);
    const compDays = sortedData.map(d => d.completion_days || 0);
    
    const colors = isDarkMode 
      ? ['#8ab4f8', '#65dca4']
      : ['#0f2a43', '#00B8D9']; // Navy and Cyan

    const drillSeriesName = currentLang === 'es' ? "Días de Perforación (Drilling)" : "Drilling Days";
    const compSeriesName = currentLang === 'es' ? "Días de Terminación (Completion)" : "Completion Days";
    const yaxisTitle = currentLang === 'es' ? "Duración de Intervención (Días)" : "Intervention Duration (Days)";

    const options = {
      series: [
        { name: drillSeriesName, data: drillDays },
        { name: compSeriesName, data: compDays }
      ],
      chart: {
        type: 'bar',
        height: 350,
        stacked: true,
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false },
        background: 'transparent'
      },
      colors: colors,
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 2
        }
      },
      xaxis: {
        categories: categories,
        labels: {
          style: {
            colors: isDarkMode ? '#8a99ad' : '#74777e',
            fontFamily: 'JetBrains Mono, monospace'
          }
        }
      },
      yaxis: {
        title: { text: yaxisTitle, style: { color: isDarkMode ? '#f0f4fa' : '#101c2d' } },
        labels: {
          style: { colors: isDarkMode ? '#8a99ad' : '#74777e' }
        }
      },
      legend: {
        position: 'bottom',
        labels: { colors: isDarkMode ? '#c3cbde' : '#101c2d' }
      },
      grid: {
        borderColor: isDarkMode ? '#2e3b52' : '#dfe1e6',
        strokeDashArray: 2
      },
      tooltip: {
        theme: isDarkMode ? 'dark' : 'light'
      }
    };

    if (dcDaysChart) {
      dcDaysChart.updateOptions(options);
    } else {
      dcDaysChart = new ApexCharts(document.getElementById("chart-dc-days"), options);
      dcDaysChart.render();
    }
  }


  // INITIAL BOOTSTRAP
  updateUILanguage();
  populateProdWellSelect();
  updateDashboardView();
});

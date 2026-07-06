import streamlit as st
import streamlit.components.v1 as components
import os
import yaml
import hashlib

# Configuración inicial de la página
st.set_page_config(layout="wide", page_title="Ek-Balam Viewer Secure Access", page_icon="🔒")

CREDENTIALS_FILE = "credentials.yaml"

def get_sha256(password):
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def load_credentials():
    # Inicializar archivo de credenciales por defecto si no existe
    if not os.path.exists(CREDENTIALS_FILE):
        default_config = {
            "users": {
                "sierramadre": {
                    "name": "Sierra Madre Admin",
                    "password_hash": get_sha256("ekbalam2026")
                }
            }
        }
        with open(CREDENTIALS_FILE, "w", encoding="utf-8") as f:
            yaml.dump(default_config, f, default_flow_style=False)
            
    # Leer las credenciales
    with open(CREDENTIALS_FILE, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def compile_in_memory():
    import base64
    import re
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    index_path = os.path.join(base_dir, "index.html")
    css_path = os.path.join(base_dir, "style.css")
    app_path = os.path.join(base_dir, "app.js")
    logo_path = os.path.join(base_dir, "mi_logo.png")
    
    data_path = os.path.join(base_dir, "public", "data.js")
    if not os.path.exists(data_path):
        data_path = os.path.join(base_dir, "data.js")
        
    # Verificar existencia de archivos esenciales
    for path, name in [(index_path, "index.html"), (css_path, "style.css"), 
                       (data_path, "public/data.js o data.js"), (app_path, "app.js")]:
        if not os.path.exists(path):
            raise FileNotFoundError(f"No se encontró el archivo requerido: {name}")
            
    # Leer archivos
    with open(index_path, "r", encoding="utf-8") as f:
        html_content = f.read()
    with open(css_path, "r", encoding="utf-8") as f:
        css_content = f.read()
    with open(app_path, "r", encoding="utf-8") as f:
        app_content = f.read()
    with open(data_path, "r", encoding="utf-8") as f:
        data_content = f.read()
        
    # Validar tamaño de datos
    if len(data_content.strip()) < 100:
        raise ValueError("El archivo de datos data.js está vacío o contiene información insuficiente.")
        
    # Validar estructura de datos JSON
    try:
        js_clean = data_content.strip()
        assign_idx = js_clean.find("window.FIELD_DATA =")
        if assign_idx != -1:
            js_clean = js_clean[assign_idx + len("window.FIELD_DATA ="):].strip()
        if js_clean.endswith(";"):
            js_clean = js_clean[:-1].strip()
        
        import json
        json.loads(js_clean)
    except Exception as e:
        raise ValueError(f"La base de datos data.js está corrupta o incompleta (JSON inválido): {e}")
        
    # Incrustar logo
    if os.path.exists(logo_path):
        with open(logo_path, "rb") as f:
            logo_data = f.read()
            logo_base64 = base64.b64encode(logo_data).decode("utf-8")
        html_content = html_content.replace('src="mi_logo.png"', f'src="data:image/png;base64,{logo_base64}"')
        
    # Reemplazos de scripts y CSS (usando funciones lambda para evitar el procesamiento de secuencias de escape de expresiones regulares)
    css_pattern = r'<link\s+[^>]*href=["\']style\.css["\'][^>]*>'
    html_content, css_count = re.subn(css_pattern, lambda m: f"<style>\n{css_content}\n</style>", html_content)
    
    data_pattern = r'<script\s+[^>]*src=["\'](?:public/)?data\.js["\'][^>]*>\s*</script>'
    html_content, data_count = re.subn(data_pattern, lambda m: f"<script>\n{data_content}\n</script>", html_content)
    if data_count == 0:
        raise ValueError("No se encontró la referencia a public/data.js en index.html.")
        
    app_pattern = r'<script\s+[^>]*src=["\']app\.js["\'][^>]*>\s*</script>'
    html_content, app_count = re.subn(app_pattern, lambda m: f"<script>\n{app_content}\n</script>", html_content)
    if app_count == 0:
        raise ValueError("No se encontró la referencia a app.js en index.html.")
        
    data_size_kb = len(data_content) / 1024
    return html_content, data_size_kb

# Inicializar sesión
if "authenticated" not in st.session_state:
    st.session_state["authenticated"] = False

# Aplicar estilos CSS basados en el estado de autenticación
if not st.session_state["authenticated"]:
    # Estilo centrado para la ventana de Login idéntico a la imagen provista
    st.markdown("""
    <style>
    /* Ocultar barra de herramientas y menú de Streamlit */
    header, footer, [data-testid="stSidebar"] {
        visibility: hidden;
        height: 0px;
    }
    
    /* Centrar la ventana de login en la pantalla */
    .main {
        background-color: #f8fafc;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
    }
    
    .main .block-container {
        max-width: 440px !important;
        margin: auto !important;
        margin-top: 15vh !important;
        background: #ffffff !important;
        border-radius: 12px !important;
        border: 1px solid #e2e8f0 !important;
        padding: 2.5rem !important;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05) !important;
    }
    
    /* Título "Login" */
    .login-title {
        font-size: 26px;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 24px;
        font-family: 'Inter', sans-serif;
    }
    
    /* Contenedor de formulario de Streamlit */
    div[data-testid="stForm"] {
        border: none !important;
        padding: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
    }
    
    /* Etiquetas de los campos */
    label {
        font-size: 14px !important;
        font-weight: 600 !important;
        color: #475569 !important;
        margin-bottom: 6px !important;
        font-family: 'Inter', sans-serif !important;
    }
    
    /* Campos de Entrada */
    input {
        background-color: #f1f5f9 !important;
        border: 1px solid transparent !important;
        border-radius: 8px !important;
        padding: 12px 14px !important;
        color: #0f172a !important;
        font-size: 14px !important;
        font-family: 'Inter', sans-serif !important;
        transition: all 0.2s ease !important;
    }
    
    input:focus {
        border-color: #cbd5e1 !important;
        background-color: #ffffff !important;
        box-shadow: none !important;
    }
    
    /* Botón "Access Application" */
    button[kind="secondaryFormSubmit"] {
        background-color: #ffffff !important;
        border: 1px solid #cbd5e1 !important;
        color: #334155 !important;
        border-radius: 8px !important;
        padding: 12px 24px !important;
        font-weight: 600 !important;
        font-size: 14px !important;
        transition: all 0.2s ease !important;
        width: 100% !important;
        box-shadow: none !important;
        margin-top: 16px !important;
        font-family: 'Inter', sans-serif !important;
    }
    
    button[kind="secondaryFormSubmit"]:hover {
        background-color: #f8fafc !important;
        border-color: #94a3b8 !important;
        color: #0f172a !important;
    }
    </style>
    """, unsafe_allow_html=True)

    # Renderizar el formulario de inicio de sesión
    st.markdown('<div class="login-title">Login</div>', unsafe_allow_html=True)
    
    with st.form("login_form"):
        username = st.text_input("Username", key="input_username")
        password = st.text_input("Password", type="password", key="input_password")
        submit = st.form_submit_button("Access Application")
        
        if submit:
            credentials = load_credentials()
            user_info = credentials.get("users", {}).get(username)
            
            if user_info and user_info["password_hash"] == get_sha256(password):
                st.session_state["authenticated"] = True
                st.session_state["user_name"] = user_info["name"]
                st.rerun()
            else:
                st.error("Invalid username or password.")

else:
    # Estilos CSS de pantalla completa para cuando el usuario ya ingresó
    st.markdown("""
    <style>
    /* Forzar al contenedor principal a ocupar el 100% de la pantalla sin márgenes */
    .main .block-container {
        max-width: 100vw !important;
        padding: 0px !important;
        margin: 0px !important;
        height: 100vh !important;
    }
    
    /* Posicionar el iframe de forma fija y absoluta cubriendo el 100% del viewport */
    iframe {
        position: fixed !important;
        top: 0px !important;
        left: 0px !important;
        width: 100vw !important;
        height: 100vh !important;
        border: none !important;
        margin: 0px !important;
        padding: 0px !important;
        z-index: 1 !important;
    }
    
    /* Ocultar elementos nativos de Streamlit (cabecera, pie de página, barra lateral) */
    header[data-testid="stHeader"], footer, [data-testid="stSidebar"] {
        display: none !important;
    }
    
    /* Botón flotante para cerrar sesión (Pill moderno flotando sobre el iframe) */
    .logout-btn-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999 !important;
    }
    .logout-btn-container button {
        background-color: #ffffff !important;
        color: #0f172a !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 30px !important;
        padding: 8px 20px !important;
        font-weight: 600 !important;
        font-size: 13px !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        transition: all 0.2s ease !important;
        font-family: 'Inter', sans-serif !important;
    }
    .logout-btn-container button:hover {
        background-color: #f8fafc !important;
        border-color: #94a3b8 !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 6px 8px -1px rgba(0, 0, 0, 0.1), 0 3px 6px -1px rgba(0, 0, 0, 0.08) !important;
    }
    </style>
    """, unsafe_allow_html=True)

    # Compilar y obtener el HTML en memoria
    compiled_successfully = False
    compilation_error = None
    html_content = None
    data_size_kb = 0.0
    
    try:
        html_content, data_size_kb = compile_in_memory()
        compiled_successfully = True
    except Exception as e:
        compiled_successfully = False
        compilation_error = str(e)
        
    if not compiled_successfully:
        st.error("Error crítico: La compilación del visor de datos falló.")
        if compilation_error:
            st.code(compilation_error)
        st.warning("Verifique su repositorio de GitHub. Asegúrese de que el archivo 'public/data.js' no esté vacío, corrupto o incompleto.")
    else:
        # Calcular el tamaño del HTML compilado en memoria
        html_size_kb = len(html_content) / 1024
        
        # Añadir un comentario dinámico al final para romper el caché del iframe del navegador
        import time
        html_content_cached = html_content + f"\n<!-- CacheBuster: {time.time()} -->"
        
        # Mostrar el visor en un contenedor iframe de Streamlit
        components.html(html_content_cached, height=950, scrolling=True)

        # Botón flotante para cerrar sesión
        st.markdown('<div class="logout-btn-container">', unsafe_allow_html=True)
        if st.button("Cerrar Sesión", key="logout"):
            st.session_state["authenticated"] = False
            st.session_state.pop("user_name", None)
            st.rerun()
        st.markdown('</div>', unsafe_allow_html=True)

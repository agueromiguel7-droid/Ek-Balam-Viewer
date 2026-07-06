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
    /* Pantalla completa e iframe sin bordes ni márgenes */
    .main .block-container {
        max-width: 100% !important;
        padding: 0px !important;
        margin: 0px !important;
    }
    iframe {
        border: none;
        width: 100vw;
        height: 100vh;
    }
    header, footer {
        visibility: hidden;
        height: 0px;
    }
    
    /* Botón flotante para cerrar sesión en la parte superior izquierda */
    .logout-btn-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
    }
    </style>
    """, unsafe_allow_html=True)

    # Compilar automáticamente en cada inicio del servidor para asegurar que todo esté integrado
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist", "index.html")
    compiled_successfully = False
    
    try:
        import compile_app
        compiled_successfully = compile_app.compile_app()
    except Exception as e:
        st.error(f"Error al compilar automáticamente: {e}")
        
    if not compiled_successfully:
        st.error("Error: No se pudo generar la aplicación. Asegúrese de que el archivo de datos ('data.js' en la carpeta raíz o dentro de la carpeta 'public/') y todos los archivos fuente ('index.html', 'style.css', 'app.js') estén subidos a su repositorio de GitHub.")
    else:
        # Cargar el archivo autocontenido
        with open(output_path, "r", encoding="utf-8") as f:
            html_content = f.read()
        
        # Calcular tamaños de archivo para diagnóstico
        data_path_diagnose = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "data.js")
        if not os.path.exists(data_path_diagnose):
            data_path_diagnose = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data.js")
            
        data_size_kb = os.path.getsize(data_path_diagnose) / 1024 if os.path.exists(data_path_diagnose) else 0
        html_size_kb = os.path.getsize(output_path) / 1024 if os.path.exists(output_path) else 0
        
        # Verificar que los datos realmente se inyectaron y contienen información de pozos
        if "window.FIELD_DATA" not in html_content or '"wells":' not in html_content:
            st.error("Error crítico: La base de datos de pozos ('wells') no se encontró dentro del visor compilado. Asegúrese de que el archivo 'public/data.js' local no esté vacío y contenga los datos extraídos (ejecutando python scripts/extract_data.py) antes de subirlo.")
        else:
            # Añadir un comentario dinámico al final para romper el caché del iframe del navegador
            import time
            html_content_cached = html_content + f"\n<!-- CacheBuster: {time.time()} -->"
            
            # Mostrar el visor en un contenedor iframe de Streamlit
            components.html(html_content_cached, height=950, scrolling=True)

        # Botón flotante para cerrar sesión y diagnósticos en la barra lateral
        st.markdown('<div class="logout-btn-container">', unsafe_allow_html=True)
        if st.sidebar.button("Cerrar Sesión", key="logout"):
            st.session_state["authenticated"] = False
            st.session_state.pop("user_name", None)
            st.rerun()
        st.sidebar.markdown("---")
        st.sidebar.caption(f"Base de Datos: {data_size_kb:.1f} KB")
        st.sidebar.caption(f"Visor Compilado: {html_size_kb:.1f} KB")
        st.markdown('</div>', unsafe_allow_html=True)

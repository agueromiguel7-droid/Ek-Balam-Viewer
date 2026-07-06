import base64
import os
import re

def compile_app():
    print("Iniciando compilación del visor...")
    
    # Rutas de archivos
    base_dir = os.path.dirname(os.path.abspath(__file__))
    index_path = os.path.join(base_dir, "index.html")
    css_path = os.path.join(base_dir, "style.css")
    app_path = os.path.join(base_dir, "app.js")
    logo_path = os.path.join(base_dir, "mi_logo.png")
    output_path = os.path.join(base_dir, "dist", "index.html")

    # Intentar buscar data.js en public/ o en la raíz (como fallback)
    data_path = os.path.join(base_dir, "public", "data.js")
    if not os.path.exists(data_path):
        data_path = os.path.join(base_dir, "data.js")

    # Verificar existencia de archivos esenciales
    for path, name in [(index_path, "index.html"), (css_path, "style.css"), 
                       (data_path, "public/data.js o data.js"), (app_path, "app.js")]:
        if not os.path.exists(path):
            print(f"Error: No se encontró el archivo requerido: {name}")
            return False

    # Leer archivos de soporte
    with open(css_path, "r", encoding="utf-8") as f:
        css_content = f.read()
    with open(data_path, "r", encoding="utf-8") as f:
        data_content = f.read()
    with open(app_path, "r", encoding="utf-8") as f:
        app_content = f.read()
    with open(index_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    # Validar que el archivo de datos no esté vacío y sea un JSON válido (no truncado)
    if len(data_content.strip()) < 100:
        print("Error: El archivo de datos data.js está vacío o contiene datos insuficientes.")
        return False

    try:
        # Limpiar la envoltura de JavaScript buscando 'window.FIELD_DATA ='
        js_clean = data_content.strip()
        assign_idx = js_clean.find("window.FIELD_DATA =")
        if assign_idx != -1:
            js_clean = js_clean[assign_idx + len("window.FIELD_DATA ="):].strip()
        
        if js_clean.endswith(";"):
            js_clean = js_clean[:-1].strip()
        
        import json
        json.loads(js_clean)
        print("Base de datos validada: Estructura JSON correcta.")
    except Exception as e:
        print(f"Error: La base de datos data.js está corrupta o incompleta (JSON inválido): {e}")
        return False

    # Procesar e incrustar logo en Base64 si existe
    if os.path.exists(logo_path):
        with open(logo_path, "rb") as f:
            logo_data = f.read()
            logo_base64 = base64.b64encode(logo_data).decode("utf-8")
        # Reemplazar la referencia al logo
        html_content = html_content.replace('src="mi_logo.png"', f'src="data:image/png;base64,{logo_base64}"')
        print("Logo incrustado en formato Base64.")
    else:
        print("Advertencia: mi_logo.png no encontrado, se mantendrá la referencia original.")

    # Reemplazar enlace de hoja de estilo local por etiqueta style en línea
    css_pattern = r'<link\s+[^>]*href=["\']style\.css["\'][^>]*>'
    html_content, css_count = re.subn(css_pattern, f"<style>\n{css_content}\n</style>", html_content)
    if css_count == 0:
        print("Advertencia: No se encontró la referencia a style.css en index.html.")

    # Reemplazar scripts JS locales por etiquetas script en línea (buscando en public/data.js o data.js)
    data_pattern = r'<script\s+[^>]*src=["\'](?:public/)?data\.js["\'][^>]*>\s*</script>'
    html_content, data_count = re.subn(data_pattern, f"<script>\n{data_content}\n</script>", html_content)
    if data_count == 0:
        print("Error: No se encontró la etiqueta <script src='public/data.js'> en index.html.")
        return False
    
    app_pattern = r'<script\s+[^>]*src=["\']app\.js["\'][^>]*>\s*</script>'
    html_content, app_count = re.subn(app_pattern, f"<script>\n{app_content}\n</script>", html_content)
    if app_count == 0:
        print("Error: No se encontró la etiqueta <script src='app.js'> en index.html.")
        return False

    # Escribir el archivo HTML autocontenido
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
        
    print(f"Éxito: Aplicación autocontenida generada en {output_path}")
    return True

if __name__ == "__main__":
    compile_app()

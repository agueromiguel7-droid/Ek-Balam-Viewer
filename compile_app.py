import base64
import os
import re

def compile_app():
    print("Iniciando compilación del visor...")
    
    # Rutas de archivos
    base_dir = os.path.dirname(os.path.abspath(__file__))
    index_path = os.path.join(base_dir, "index.html")
    css_path = os.path.join(base_dir, "style.css")
    data_path = os.path.join(base_dir, "public", "data.js")
    app_path = os.path.join(base_dir, "app.js")
    logo_path = os.path.join(base_dir, "mi_logo.png")
    output_path = os.path.join(base_dir, "dist", "index.html")

    # Verificar existencia de archivos esenciales
    for path, name in [(index_path, "index.html"), (css_path, "style.css"), 
                       (data_path, "public/data.js"), (app_path, "app.js")]:
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
    html_content = re.sub(
        r'<link\s+rel="stylesheet"\s+href="style\.css"\s*/?>',
        f"<style>\n{css_content}\n</style>",
        html_content
    )

    # Reemplazar scripts JS locales por etiquetas script en línea
    html_content = re.sub(
        r'<script\s+src="public/data\.js"\s*></script>',
        f"<script>\n{data_content}\n</script>",
        html_content
    )
    
    html_content = re.sub(
        r'<script\s+src="app\.js"\s*></script>',
        f"<script>\n{app_content}\n</script>",
        html_content
    )

    # Escribir el archivo HTML autocontenido
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
        
    print(f"Éxito: Aplicación autocontenida generada en {output_path}")
    return True

if __name__ == "__main__":
    compile_app()

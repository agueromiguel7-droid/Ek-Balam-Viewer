import os
import yaml
import hashlib
import sys

CREDENTIALS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "credentials.yaml")

def get_sha256(password):
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def add_user(username, name, password):
    # Cargar archivo existente o inicializar estructura
    if os.path.exists(CREDENTIALS_FILE):
        with open(CREDENTIALS_FILE, "r", encoding="utf-8") as f:
            try:
                config = yaml.safe_load(f) or {}
            except Exception:
                config = {}
    else:
        config = {}

    if "users" not in config:
        config["users"] = {}

    # Generar hash y guardar
    config["users"][username] = {
        "name": name,
        "password_hash": get_sha256(password)
    }

    with open(CREDENTIALS_FILE, "w", encoding="utf-8") as f:
        yaml.dump(config, f, default_flow_style=False)

    print(f"Éxito: Usuario '{username}' ({name}) agregado/actualizado con contraseña cifrada.")

if __name__ == "__main__":
    if len(sys.argv) >= 4:
        username = sys.argv[1]
        name = sys.argv[2]
        password = sys.argv[3]
        add_user(username, name, password)
    else:
        print("\n=== Agregar / Editar Usuario ===")
        username = input("Ingrese nombre de usuario (ej. jgomez): ").strip()
        if not username:
            print("El usuario no puede estar vacío.")
            sys.exit(1)
        name = input("Ingrese nombre completo para mostrar (ej. Juan Gómez): ").strip()
        password = input("Ingrese contraseña para el usuario: ").strip()
        if not password:
            print("La contraseña no puede estar vacía.")
            sys.exit(1)
        add_user(username, name, password)

import pandas as pd

# Definir los campos para la plantilla de importación masiva de aprendices
columnas = [
    "TIPO_DOCUMENTO",
    "NUMERO_DOCUMENTO",
    "NOMBRES",
    "APELLIDOS",
    "CORREO_ELECTRONICO",
    "TELEFONO",
    "FICHA_CARACTERIZACION"
]

# Datos de ejemplo para guiar al usuario
datos_ejemplo = [
    ["CC", "1002003004", "Juan Pablo", "Perez Gomez", "juan.perez@misena.edu.co", "3001234567", "3146013"],
    ["TI", "1050607080", "Maria Camila", "Lopez Diaz", "maria.lopez@misena.edu.co", "3109876543", "3146013"]
]

df = pd.DataFrame(datos_ejemplo, columns=columnas)

# Guardar en Excel
archivo_salida = "Plantilla_Importacion_Aprendices.xlsx"
df.to_excel(archivo_salida, index=False)

print(f"Archivo {archivo_salida} creado exitosamente.")

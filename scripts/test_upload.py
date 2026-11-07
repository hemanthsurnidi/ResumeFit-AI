import urllib.request
import uuid
import os
import fitz  # PyMuPDF

# Create a sample PDF with real text using PyMuPDF
doc = fitz.open()
page = doc.new_page()
page.insert_text((50, 72), "Hemanth Surnidi - Senior Machine Learning Engineer\nPython, PyTorch, LoRA, PEFT, Hugging Face, Transformers, FastAPI, Docker, SQL, AWS")
sample_pdf = "uploads/sample_resume.pdf"
os.makedirs("uploads", exist_ok=True)
doc.save(sample_pdf)
doc.close()

boundary = "----WebKitFormBoundary" + uuid.uuid4().hex
with open(sample_pdf, "rb") as f:
    file_bytes = f.read()

parts = [
    f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"sample_resume.pdf\"\r\nContent-Type: application/pdf\r\n\r\n".encode("utf-8"),
    file_bytes,
    f"\r\n--{boundary}--\r\n".encode("utf-8"),
]
body = b"".join(parts)

req = urllib.request.Request(
    "http://localhost:8000/api/resume/upload",
    data=body,
    headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
)

try:
    with urllib.request.urlopen(req) as resp:
        print("Upload Status:", resp.status)
        print("Response:", resp.read().decode())
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code, e.read().decode())
except Exception as e:
    print("Error:", e)

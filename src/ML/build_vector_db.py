# import os
# from langchain_community.vectorstores import Chroma
# from langchain_community.embeddings import HuggingFaceEmbeddings

# from config import PDF_FOLDER, DB_FOLDER, EMBEDDING_MODEL
# from utils.pdf_loader import extract_text_from_pdf
# from utils.chunking import create_chunks


# def load_all_pdfs():
#     all_chunks = []

#     for file in os.listdir(PDF_FOLDER):
#         if file.endswith(".pdf"):
#             path = os.path.join(PDF_FOLDER, file)

#             text = extract_text_from_pdf(path)
#             chunks = create_chunks(text)

#             for chunk in chunks:
#                 all_chunks.append({
#                     "text": chunk,
#                     "metadata": {
#                         "source_file": file
#                     }
#                 })

#     return all_chunks


# def build_db():
#     docs = load_all_pdfs()

#     texts = [doc["text"] for doc in docs]
#     metadatas = [doc["metadata"] for doc in docs]

#     embedding_model = HuggingFaceEmbeddings(
#         model_name=EMBEDDING_MODEL
#     )

#     db = Chroma.from_texts(
#         texts=texts,
#         embedding=embedding_model,
#         metadatas=metadatas,
#         persist_directory=DB_FOLDER
#     )

#     db.persist()
#     print("✅ Vector DB created successfully")


# if __name__ == "__main__":
#     build_db()





import re

import os
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

from config import PDF_FOLDER, DB_FOLDER, EMBEDDING_MODEL
from utils.pdf_loader import extract_text_from_pdf
from utils.chunking import create_chunks

def is_formula_chunk(text):
    patterns = [
        r"=",
        r"→",
        r"Δ",
        r"\bKc\b",
        r"\bKa\b",
        r"\bpH\b",
        r"\bPV\s*=\s*nRT\b",
        r"\bM\s*=\s*"
    ]

    return any(re.search(p, text) for p in patterns)


def load_all_pdfs():
    all_chunks = []

    for file in os.listdir(PDF_FOLDER):
        if file.endswith(".pdf"):
            path = os.path.join(PDF_FOLDER, file)

            text = extract_text_from_pdf(path)
            chunks = create_chunks(text)

            for chunk in chunks:
                metadata = {
                    "source_file": file,
                    "contains_formula": is_formula_chunk(chunk)
                }

                all_chunks.append({
                    "text": chunk,
                    "metadata": metadata
                })

    return all_chunks


def build_db():
    docs = load_all_pdfs()

    texts = [doc["text"] for doc in docs]
    metadatas = [doc["metadata"] for doc in docs]

    embedding_model = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL
    )

    db = Chroma.from_texts(
        texts=texts,
        embedding=embedding_model,
        metadatas=metadatas,
        persist_directory=DB_FOLDER
    )

    db.persist()
    print("✅ Vector DB created successfully")


if __name__ == "__main__":
    build_db()
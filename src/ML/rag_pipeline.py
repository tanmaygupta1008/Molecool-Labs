from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.llms import Ollama

from config import (
    DB_FOLDER,
    EMBEDDING_MODEL,
    OLLAMA_MODEL,
    TOP_K
)

def is_formula_query(query):
    keywords = [
        "formula",
        "equation",
        "expression",
        "law",
        "relation",
        "formula of",
        "equation of"
    ]

    query = query.lower()

    return any(keyword in query for keyword in keywords)

class ChemistryRAG:
    def __init__(self):
        self.embedding_model = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL
        )

        self.db = Chroma(
            persist_directory=DB_FOLDER,
            embedding_function=self.embedding_model
        )

        self.retriever = self.db.as_retriever(
            search_kwargs={"k": TOP_K}
        )

        self.llm = Ollama(model=OLLAMA_MODEL)


    def get_answer(self, query):
        if is_formula_query(query):
            docs = self.db.similarity_search(
                query,
                k=4,
                filter={"contains_formula": True}
            )
        else:
            docs = self.retriever.invoke(query)

        context = "\n\n".join(
            [doc.page_content for doc in docs]
        )

        prompt = f"""
    You are an expert Chemistry teacher.

    If the user asks for a formula:
    - provide the exact textbook formula
    - explain each variable
    - give one example usage

    Context:
    {context}

    Question:
    {query}

    Answer:
    """

        answer = self.llm.invoke(prompt)

        return answer, docs
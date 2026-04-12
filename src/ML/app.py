import streamlit as st
from rag_pipeline import ChemistryRAG

st.set_page_config(
    page_title="Chemistry Doubt Solver",
    layout="wide"
)

st.title("🧪 Chemistry Doubt Solving Assistant")

rag = ChemistryRAG()

query = st.text_input("Ask your chemistry doubt")

if st.button("Solve Doubt"):
    if query:
        with st.spinner("Finding answer..."):
            answer, docs = rag.get_answer(query)

        st.subheader("📘 Answer")
        st.write(answer)

        with st.expander("📚 Retrieved Context"):
            for doc in docs:
                st.write(doc.page_content)
                st.write("---")
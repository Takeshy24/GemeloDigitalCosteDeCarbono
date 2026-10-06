from docx import Document
from docx.oxml.ns import qn

path = "GD_actualizado.docx"
doc = Document(path)
body = doc.element.body
children = list(body)

def text_of(node):
    return "".join(node.itertext()) if node.tag == qn("w:p") else ""

start = next(i for i, node in enumerate(children) if text_of(node).startswith("Informe de mejoras del laboratorio"))
anchor = next(node for node in children if text_of(node).startswith("1. .streamlit/config.toml"))
to_move = [node for node in children[start:] if node.tag in {qn("w:p"), qn("w:tbl")}]
for node in to_move:
    anchor.addprevious(node)
doc.save(path)
print("reordered", len(to_move))

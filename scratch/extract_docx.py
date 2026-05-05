import zipfile
import xml.etree.ElementTree as ET
import os

def docx_to_text(path):
    try:
        with zipfile.ZipFile(path) as z:
            xml_content = z.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            # Extract all text, maintaining some structure
            paragraphs = []
            for p in tree.findall('.//w:p', ns):
                texts = [t.text for t in p.findall('.//w:t', ns) if t.text]
                if texts:
                    paragraphs.append(''.join(texts))
            
            return '\n'.join(paragraphs)
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    filename = "Вимоги до сайту.docx"
    if os.path.exists(filename):
        text = docx_to_text(filename)
        # Write to a text file with UTF-8
        with open('scratch/requirements.txt', 'w', encoding='utf-8') as f:
            f.write(text)
        print("Extracted text to scratch/requirements.txt")
    else:
        print(f"File {filename} not found.")

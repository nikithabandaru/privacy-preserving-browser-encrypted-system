from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import cm

doc = SimpleDocTemplate("test_ocr_document.pdf", pagesize=A4)
styles = getSampleStyleSheet()
story = []

title = Paragraph("Employee Performance Report - Q3 2026", styles['Title'])
story.append(title)
story.append(Spacer(1, 0.5*cm))

content = [
    ("Employee Name:", "Nikitha Bandaru"),
    ("Department:", "Software Engineering"),
    ("Designation:", "Senior Developer"),
    ("Salary:", "85000 per annum"),
    ("Experience:", "5 years"),
    ("Location:", "Chennai, Tamil Nadu"),
]

story.append(Paragraph("<b>Employee Details</b>", styles['Heading2']))
story.append(Spacer(1, 0.3*cm))
for label, value in content:
    story.append(Paragraph(f"<b>{label}</b> {value}", styles['Normal']))
    story.append(Spacer(1, 0.2*cm))

story.append(Spacer(1, 0.5*cm))
story.append(Paragraph("<b>Performance Summary</b>", styles['Heading2']))
story.append(Spacer(1, 0.3*cm))

summary = """
This report summarizes the quarterly performance evaluation for the above employee. 
The candidate demonstrated exceptional skills in software development, project management, 
and team collaboration. Areas of expertise include Python programming, Java backend development, 
React frontend development, and MongoDB database management.

The employee successfully delivered the Digital Asset Management System (DAMS) project 
which included encryption, authentication, and secure file storage features. 
The system received excellent feedback from stakeholders.

Skills assessed: programming, encryption, database, security, leadership, communication.
Overall rating: Outstanding.
Recommended for promotion: Yes.
"""
story.append(Paragraph(summary.strip(), styles['Normal']))

doc.build(story)
print("PDF created: test_ocr_document.pdf")

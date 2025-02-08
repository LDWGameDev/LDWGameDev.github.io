import openpyxl

def xlsx_to_text(xlsx_file, output_file):
    wb = openpyxl.load_workbook(xlsx_file)
    sheet = wb.active

    projects = []

    for row in sheet.iter_rows(min_row=2, values_only=True):  # Skip the header row
        name, image, tags_str, time, description, content_str = row
        tags = [tag.strip() for tag in tags_str.split(',')] if tags_str else []

        # Split content using new lines (Alt + Enter in Excel)
        content_items = content_str.split('\n') if content_str else []

        # Format content back to the original structure
        content = []
        for idx, item in enumerate(content_items):
            content.append(f'{idx} = "{item.strip()}"')
        
        project_dict = (
            f'{{ name = "{name}", image = "{image}", tags = {tags}, '
            f'time = "{time}", description = "{description}", content = [{{ {", ".join(content)} }}] }}'
        )

        projects.append(project_dict)

    # Write to text file in the specified format
    with open(output_file, 'w') as f:
        f.write('[params]\n')
        f.write('  projects = [\n')
        for proj in projects:
            f.write(f'    {proj},\n')
        f.write('  ]\n')
        
xlsx_to_text('projects.xlsx', 'output.txt')
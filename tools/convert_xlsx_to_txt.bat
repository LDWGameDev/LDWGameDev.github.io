@echo off

:: Run the Python script to convert xlsx to txt
python convert_projects_xlsx_to_txt.py

:: Copy the content of output.txt to the clipboard
powershell -command "Get-Content output.txt | Set-Clipboard"


# Rules for Input dataset

- General rules:
    - Column names for the clinical field 
    - If the clinical-related column names have postfix indicating the data format (i.e. '-DATE', '-STRING', '-NUMBER', '-BOOLEAN'), the values will be parsed accordingly. If datatype is not specified from the column name, the value will be auto-interpreted by the code. 
    - Sheet name is used to determine the 'sheet_type', 'data_type', 'dataset_name'. The delimiter is “-“.
        - sheet_type could be [“PATIENT”, “PATIENTEVENT”, “SAMPLE”, “MATRIX”]
            - i.e. PATIENTEVENT-RADIATION
        - data_type could be [“EXPR”, “CNV”, “CNV_THD”, “MUT01”, "MUT", "METH", "METH_THD"]
            - [“EXPR”, “CNV”, “CNV_THD”, “MUT01”] are interpreted as float number 
            - "MUT" is interpreted as strings. 
            - “METH”, “METH_THD” are accepted, however the values need to be rolled up to gene-level and fit into the Molecular sheet format. Please be mindful of the size since so far oncoscape uploading tool only accept excel format. 
        - data_name is unique identifier defined by users. 
        - Here are some sample sheet names: "PATIENT", "SAMPLE", "PATIENTEVENT-RADIATION`", "MATRIX-CNV-CNA", "MATRIX-CNV-log2CNA", and "MATRIX-EXPR-median". 
        
- PATIENT [required]
    - Each row is one unique patient record. 
    - First column must be patient ID. The exact column name can be defined by users. 

- PATIENT EVENT 
    - Each row is one unique patient event record. 
    - First column is patient ID
    - Second column must be event start date. 
    - Third column must be event end date. 
    - Fourth column must be event type.
    - Fifth column must be event subtype. Subtype values should be unique across the entire dataset and each subtype should match to only one type. 

- SAMPLE [Required] to create sample-mapping 
    - Each row is one unique sample record
    - First column should be sampleID. The exact column name can be defined by users. 
    - Second column must be patientID. The exact column name can be defined by users.

- MATRIX-MOLECULAR
    - General rules:
        - Column names are sample names
        - Row names are marker names
        - [0,0] defines 'marker_type' and 'subject_type'
            - 'marker_type' could be 'Hugo', 'Entrez', etc...
            - 'subject_type' could be 'Sample', 'Patient', etc...
            - I.e. “Hugo_patient” “Hugo_sample”, “Entrez_sample”, “Protein_object” so far all sample-specific. Potentially can be expanded to patient-level data. 




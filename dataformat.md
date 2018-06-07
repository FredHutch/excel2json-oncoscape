# Rules for Input dataset

## General rules:

#### Column names and data types
- For Clinical-related tables (PATIENT, PATIENT EVENT etc.), the dafault data type is **string**. User can append postfix to specify other data types to ensure the downstream calculation. 
    - '-N' as numerica values
    - '-S' as string
    - '-D' as date
    - '-B' as boolean
- The default data type for molecular data in matrix format is **numeric**. User can append postfix to specify other data types to ensure the downstream calculation. 

#### Sheet naming convention

- Clinical EVENT naming convention
    - sheet name is used to determine the 'sheet_type', 'event_category', 'event_subcategory'. The delimiter is “-“.
    - one example: EVENT-TREATMENT-RADIATION. 
- Molecular MATRIX naming convention
    - Sheet name is used to determine the 'sheet_type', 'data_type', 'dataset_name'. The delimiter is “-“.
    - data_type could be [“RNA”, “GISTIC”, “GISTIC_THRESHOLD”, "MUT", “METH”, “METH_THD”]
        - [“RNA”, “GISTIC”, “GISTIC_THRESHOLD”] are interpreted as float number 
        - "MUT" is interpreted as strings. 
        - “METH”, “METH_THD” are accepted, however the values need to be rolled up to gene-level and fit into the Molecular sheet format. Please be mindful of the size since so far oncoscape uploading tool only accept excel format. 
    - data_name is unique identifier defined by users. 
    - one example: MATRIX-EXPR-Agilent
        
## PATIENT [required]

- Each row is one unique patient record. 
- There must be a column named "patientId", representing patient identifier. 

## PATIENT EVENT 

- Each row is one unique patient event record. 
- There must be a column named "patientId", which represents patient identification.
- There must be a column named "start", which represents event start date. 
- There must be a column named "end", which represents event end date. 

## SAMPLE [Required] to create sample-mapping 

- Each row is one unique sample record
- There must be a column named "sampleId", which represents sample identification. 
- There must be a column named "patientId", which represents patient identification.

## MATRIX-MOLECULAR

- General rules:
    - Column names are sample names
    - Row names are marker names

## MUTATION

- General rules:
    - There must be a column named "sampleId", which represents sample identification.
    - There must be a column named "gene", which represents gene name.
    - There must be a column named "type", which represents the gene mutation type. 







# UKF Data Types

| Fields                                                                    | UKF ORM        | Pydantic      | Database (general)                 | postgres       | sqlite  | mysql         | duckdb         | lancedb               | chroma                 | chromalite             | milvuslite             |
|---------------------------------------------------------------------------|----------------|---------------|------------------------------------|----------------|---------|---------------|----------------|-----------------------|------------------------|------------------------|------------------------|
| id                                                                        | IdType         | int           | str(63)                            | VARCHAR(63)    | TEXT    | VARCHAR(63)   | VARCHAR(63)    | STRING                | STRING                 | STRING                 | STRING                 |
| type, version, variant, source, creator, owner, workspace, collection     | ShortTextType  | str           | str(255)                           | VARCHAR(255)   | TEXT    | VARCHAR(255)  | VARCHAR(255)   | STRING                | STRING                 | STRING                 | STRING                 |
| name, notes, short_description, description, version_notes, variant_notes | MediumTextType | str           | str(2047)                          | VARCHAR(2047)  | TEXT    | VARCHAR(2047) | VARCHAR(2047)  | STRING                | STRING                 | STRING                 | STRING                 |
| content                                                                   | LongTextType   | str           | str(65535)                         | VARCHAR(65535) | TEXT    | TEXT          | VARCHAR(65535) | STRING                | STRING                 | STRING                 | STRING                 |
| content_resources, parents, metadta, profile, content_composers, triggers | JsonType       | dict          | blob / str(65535) / json           | JSONB          | TEXT    | TEXT          | JSON           | JSON                  | STRING                 | STRING                 | JSON                   |
| timestamp, last_verified                                                  | TimestampType  | datetime      | timestamp / int                    | TIMESTAMP      | BIGINT  | TIMESTAMP     | TIMESTAMP      | INT64                 | INT64                  | INT64                  | INT64                  |
| expiration                                                                | IntervalType   | int           | int / interval                     | INTEGER        | INTEGER | INTEGER       | INTEGER        | INT64                 | INT64                  | INT64                  | INT64                  |
| priority                                                                  | IntegerType    | int           | int                                | INTEGER        | INTEGER | INTEGER       | INTEGER        | INT64                 | INT64                  | INT64                  | INT64                  |
| timefluid, inactive_mark                                                  | BooleanType    | bool          | bool / int                         | BOOLEAN        | INTEGER | TINYINT(1)    | BOOLEAN        | BOOL                  | BOOL                   | BOOL                   | BOOL                   |
| content_composers.value, triggers.value                                   | CallableType   | func          | blob / str(65535) / json           | JSONB          | TEXT    | TEXT          | JSON           | JSON                  | STRING                 | STRING                 | JSON                   |
| tags                                                                      | TagsType       | set           | NF(idx, slot, value)               | <NF>           | <NF>    | <NF>          | <NF>           | LIST<STRING>          | STRING                 | STRING                 | ARRAY(VARCHAR(65535))  |
| synonyms                                                                  | SynonymsType   | set           | NF(idx, synonym)                   | <NF>           | <NF>    | <NF>          | <NF>           | LIST<STRING>          | STRING                 | STRING                 | ARRAY(VARCHAR(65535))  |
| auths                                                                     | AuthsType      | set           | NF(idx, user, auth)                | <NF>           | <NF>    | <NF>          | <NF>           | LIST<STRING>          | STRING                 | STRING                 | ARRAY(VARCHAR(65535))  |
| related                                                                   | RelatedType    | set           | NF(idx, s, r, o, r_idx, r_payload) | <NF>           | <NF>    | <NF>          | <NF>           | LIST<STRING>          | STRING                 | STRING                 | ARRAY(VARCHAR(65535))  |
|                                                                           | VectorType     | list\[float\] |                                    |                |         |               |                | FIXED_SIZE_LIST<FLOAT>| FLOAT_VECTOR           | FLOAT_VECTOR           | FLOAT_VECTOR           |

<br/>

## Further Exploration

> **Tip:** For more information about UKF, see:
> - [UKF v1.0](./ukf-v1.0.md) - UKF v1.0 Full Documentation
> - [Architecture](../../introduction/architecture.md) - Agent Heaven Architecture Overview

<br/>

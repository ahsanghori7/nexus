#!/bin/bash

#HARDCODED VALUES FOR TESTING
parent_id=22661 #project id
entity_id=1 #tender id
signatory_id_1="a-b" #signatory hash id
signatory_id_2="ab-cd" #signatory hash id
category_label="Category Label"
category_label_modified="Category label modified from patch" #used to test that we can change an existing category label

#GET
urls=(
    "http://document.local/v1/document?id=1"
    "http://document.local/v1/document/type"
    "http://document.local/v1/document/subtype"
    "http://document.local/v1/document/type/1/unmapped"
    "http://document.local/v1/document/search/cjos"
    "http://document.local/v1/document/1"
    "http://document.local/v1/document/1/owner"
    "http://document.local/v1/document/1/children"
    "http://document.local/v1/document/1/category"
    "http://document.local/v1/document/1/signatory"
    "http://document.local/v1/document/envelope/1"
    "http://document.local/v1/document/1/signers"
    "http://document.local/v1/document/[1,2]/signers"
    "http://document.local/v1/document/constants"
    "http://document.local/v1/document/requested"
    "http://document.local/v1/document/request/type"
    "http://document.local/v1/document/preq_default_certificates"
    "http://document.local/v1/signatory"
    "http://document.local/v1/signatory/status"
    "http://document.local/v1/instruction/1"
    "http://document.local/v1/category?entity_id=$entity_id"
    "http://document.local/v1/category/1"
    "http://document.local/v1/category/1/document"
    "http://document.local/v1/category/search/pricing"
    "http://document.local/v1/category/constants"
)
for url in "${urls[@]}"; do
    status_code=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$url")
    echo "$url - $status_code"
done

#POST PATCH DELETE
curl -s -X POST "http://document.local/v2/document" \
    -H "Content-Type: application/json" \
    -d '{ "owner_id": 1, "name": "Document test from v2", "type": 1, "subtype": 6 }'

response=$(curl -s -X POST "http://document.local/v1/document" \
    -H "Content-Type: application/json" \
    -d '{ "owner_id": 1, "name": "Document test from v1", "type": 1, "subtype": 6 }')

document_id=$(echo "$response" | jq -r '.data.id')
curl -X PATCH "http://document.local/v1/document/$document_id" \
    -H "Content-Type: application/json" \
    -d '{ "owner_id": 1, "name": "Document name changed test"}'

curl -X PATCH "http://document.local/v1/document/$document_id/owner" \
    -H "Content-Type: application/json" \
    -d '{ "owner_id": 166}'

curl -X POST "http://document.local/v1/document/$document_id/signatory" \
    -H "Content-Type: application/json" \
    -d "{ \"document_id\": \"$document_id\", \"signatory_id\": \"$signatory_id_1\" }"

curl -X POST "http://document.local/v1/document/$document_id/signatory/signer" \
    -H "Content-Type: application/json" \
    -d "{ \"user_id\": 166, \"signatory_id\": \"$signatory_id_1\", \"status_id\": 1 }"

curl -X POST "http://document.local/v1/document/$document_id/clone" \
    -H "Content-Type: application/json" \
    -d '{ "owner_id": 157}'

curl -X POST "http://document.local/v1/document/$document_id/tender" \
    -H "Content-Type: application/json" \
    -d '{ "tender_id": 1}'

response=$(curl -s -X POST "http://document.local/v1/document/request" \
    -H "Content-Type: application/json" \
    -d '{ "type": 3, "subtype": 14, "request_type": 1, "label": "Document request name", "document_owner": 166, "requestor_id": 1}')

request_id=$(echo "$response" | jq -r '.data.id')
curl -X PATCH "http://document.local/v1/document/request/$request_id" \
    -H "Content-Type: application/json" \
    -d '{ "request_fullfilled_at": "2025-03-04 00:00:00" }'

curl -X POST "http://document.local/v1/document/request/mapping" \
    -H "Content-Type: application/json" \
    -d "{ \"request_id\": \"$request_id\", \"document_id\": \"$document_id\" }"

curl -s -X POST "http://document.local/v1/signatory" \
    -H "Content-Type: application/json" \
    -d "{ \"document_id\": \"$document_id\", \"signatory_id\": \"$signatory_id_2\" }"

signatory_response_id=$(echo "$response" | jq -r '.data.id')
curl -X POST "http://document.local/v1/signatory/$signatory_response_id/signer" \
    -H "Content-Type: application/json" \
    -d "{ \"user_id\": 166, \"signatory_id\": \"$signatory_response_id\", \"status_id\": 1 }"

curl -X PATCH "http://document.local/v1/signatory/$signatory_response_id/signer" \
    -H "Content-Type: application/json" \
    -d '{ "status_id": 2, "user_id": 166 }'

response=$(curl -s -X POST "http://document.local/v1/category" \
    -H "Content-Type: application/json" \
    -d "{ \"entity_id\": \"1\", \"label\": \"$category_label\", \"entity_type\": \"project\" }")

category_id=$(echo "$response" | jq -r '.data.id')
curl -X POST "http://document.local/v1/category/default" \
    -H "Content-Type: application/json" \
    -d "{ \"entity_id\": \"$entity_id\", \"parent_id\": \"$parent_id\" }"

curl -X PATCH "http://document.local/v1/category/$category_id" \
    -H "Content-Type: application/json" \
    -d "{ \"label\": \"$category_label_modified\" }"

curl -X PATCH "http://document.local/v1/category/1/mapping/clone/1" \
    -H "Content-Type: application/json"

curl -X PATCH "http://document.local/v1/category/$category_id/document/$document_id" \
    -H "Content-Type: application/json"

curl -X POST "http://document.local/v1/category/$category_id/document/bulk" \
     -H "Content-Type: application/json"

curl -X DELETE "http://document.local/v1/document/$document_id/tender/$entity_id" \
     -H "Content-Type: application/json"

curl -X DELETE "http://document.local/v1/document/$document_id" \
     -H "Content-Type: application/json"

curl -X DELETE "http://document.local/v1/category/$category_id" \
     -H "Content-Type: application/json"

curl -X DELETE "http://document.local/v1/category/entity/$entity_id" \
     -H "Content-Type: application/json"

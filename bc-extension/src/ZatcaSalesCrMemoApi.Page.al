page 50104 "ZATCA Sales Cr.Memo API"
{
    PageType = API;
    Caption = 'ZATCA Sales Credit Memo';
    APIPublisher = 'zatca';
    APIGroup = 'compliance';
    APIVersion = 'v1.0';
    EntityName = 'zatcaSalesCreditMemo';
    EntitySetName = 'zatcaSalesCreditMemos';
    SourceTable = "Sales Cr.Memo Header";
    ODataKeyFields = SystemId;
    DelayedInsert = true;
    Extensible = false;

    layout
    {
        area(Content)
        {
            repeater(Group)
            {
                field(id; Rec.SystemId) { Editable = false; }
                field(number; Rec."No.") { Editable = false; }
                field(zatcaUuid; Rec."ZATCA UUID") { }
                field(zatcaStatus; Rec."ZATCA Status") { }
                field(zatcaClearedAt; Rec."ZATCA Cleared At") { }
                field(zatcaError; Rec."ZATCA Error") { }
            }
        }
    }
}

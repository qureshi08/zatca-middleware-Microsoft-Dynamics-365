tableextension 50102 "ZATCA Sales CrMemo Header" extends "Sales Cr.Memo Header"
{
    fields
    {
        field(50110; "ZATCA UUID"; Text[100])
        {
            Caption = 'ZATCA UUID';
            DataClassification = CustomerContent;
        }
        field(50111; "ZATCA Status"; Enum "ZATCA Status")
        {
            Caption = 'ZATCA Status';
            DataClassification = CustomerContent;
        }
        field(50112; "ZATCA Cleared At"; DateTime)
        {
            Caption = 'ZATCA Cleared At';
            DataClassification = CustomerContent;
        }
        field(50113; "ZATCA Error"; Text[250])
        {
            Caption = 'ZATCA Error';
            DataClassification = CustomerContent;
        }
    }
}

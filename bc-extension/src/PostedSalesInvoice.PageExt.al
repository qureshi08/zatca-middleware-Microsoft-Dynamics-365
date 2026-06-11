pageextension 50105 "ZATCA Posted Sales Inv." extends "Posted Sales Invoice"
{
    layout
    {
        addlast(content)
        {
            group(ZATCACompliance)
            {
                Caption = 'ZATCA Compliance';

                field("ZATCA Status"; Rec."ZATCA Status")
                {
                    ApplicationArea = All;
                    Editable = false;
                    ToolTip = 'Specifies the ZATCA clearance status for this invoice.';
                }
                field("ZATCA UUID"; Rec."ZATCA UUID")
                {
                    ApplicationArea = All;
                    Editable = false;
                    ToolTip = 'Specifies the ZATCA clearance UUID returned by FATOORA.';
                }
                field("ZATCA Cleared At"; Rec."ZATCA Cleared At")
                {
                    ApplicationArea = All;
                    Editable = false;
                    ToolTip = 'Specifies when the invoice was cleared or reported with ZATCA.';
                }
                field("ZATCA Error"; Rec."ZATCA Error")
                {
                    ApplicationArea = All;
                    Editable = false;
                    ToolTip = 'Specifies the last ZATCA submission error, if any.';
                }
            }
        }
    }
}

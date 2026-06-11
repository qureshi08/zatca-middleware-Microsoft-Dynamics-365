enum 50100 "ZATCA Status"
{
    Extensible = true;
    Caption = 'ZATCA Status';

    value(0; None) { Caption = 'None'; }
    value(1; Pending) { Caption = 'Pending'; }
    value(2; Submitted) { Caption = 'Submitted'; }
    value(3; Cleared) { Caption = 'Cleared'; }
    value(4; Reported) { Caption = 'Reported'; }
    value(5; Failed) { Caption = 'Failed'; }
}

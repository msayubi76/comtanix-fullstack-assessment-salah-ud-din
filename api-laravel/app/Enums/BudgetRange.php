<?php

namespace App\Enums;

enum BudgetRange: string
{
    case Under5k = 'under_5k';
    case From5kTo10k = '5k_10k';
    case From10kTo25k = '10k_25k';
    case From25kTo50k = '25k_50k';
    case Over50k = 'over_50k';
}

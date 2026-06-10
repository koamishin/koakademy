import { useCallback, useEffect, useId, useState } from "react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field } from "@/components/ui/field";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group";
import { ChevronDownIcon } from "lucide-react";

interface CountryCode {
    code: string;
    label: string;
}

const DEFAULT_COUNTRY_CODES: CountryCode[] = [
    { code: "+1", label: "US" },
    { code: "+1", label: "CA" },
    { code: "+7", label: "RU" },
    { code: "+20", label: "EG" },
    { code: "+27", label: "ZA" },
    { code: "+30", label: "GR" },
    { code: "+31", label: "NL" },
    { code: "+32", label: "BE" },
    { code: "+33", label: "FR" },
    { code: "+34", label: "ES" },
    { code: "+36", label: "HU" },
    { code: "+39", label: "IT" },
    { code: "+40", label: "RO" },
    { code: "+41", label: "CH" },
    { code: "+43", label: "AT" },
    { code: "+44", label: "UK" },
    { code: "+45", label: "DK" },
    { code: "+46", label: "SE" },
    { code: "+47", label: "NO" },
    { code: "+48", label: "PL" },
    { code: "+49", label: "DE" },
    { code: "+52", label: "MX" },
    { code: "+54", label: "AR" },
    { code: "+55", label: "BR" },
    { code: "+56", label: "CL" },
    { code: "+57", label: "CO" },
    { code: "+58", label: "VE" },
    { code: "+60", label: "MY" },
    { code: "+61", label: "AU" },
    { code: "+62", label: "ID" },
    { code: "+63", label: "PH" },
    { code: "+64", label: "NZ" },
    { code: "+65", label: "SG" },
    { code: "+66", label: "TH" },
    { code: "+81", label: "JP" },
    { code: "+82", label: "KR" },
    { code: "+84", label: "VN" },
    { code: "+86", label: "CN" },
    { code: "+90", label: "TR" },
    { code: "+91", label: "IN" },
    { code: "+92", label: "PK" },
    { code: "+93", label: "AF" },
    { code: "+94", label: "LK" },
    { code: "+95", label: "MM" },
    { code: "+212", label: "MA" },
    { code: "+213", label: "DZ" },
    { code: "+216", label: "TN" },
    { code: "+218", label: "LY" },
    { code: "+220", label: "GM" },
    { code: "+221", label: "SN" },
    { code: "+222", label: "MR" },
    { code: "+223", label: "ML" },
    { code: "+224", label: "GN" },
    { code: "+225", label: "CI" },
    { code: "+226", label: "BF" },
    { code: "+227", label: "NE" },
    { code: "+228", label: "TG" },
    { code: "+229", label: "BJ" },
    { code: "+230", label: "MU" },
    { code: "+231", label: "LR" },
    { code: "+232", label: "SL" },
    { code: "+233", label: "GH" },
    { code: "+234", label: "NG" },
    { code: "+235", label: "TD" },
    { code: "+236", label: "CF" },
    { code: "+237", label: "CM" },
    { code: "+238", label: "CV" },
    { code: "+239", label: "ST" },
    { code: "+240", label: "GQ" },
    { code: "+241", label: "GA" },
    { code: "+242", label: "CG" },
    { code: "+243", label: "CD" },
    { code: "+244", label: "AO" },
    { code: "+245", label: "GW" },
    { code: "+246", label: "IO" },
    { code: "+248", label: "SC" },
    { code: "+249", label: "SD" },
    { code: "+250", label: "RW" },
    { code: "+251", label: "ET" },
    { code: "+252", label: "SO" },
    { code: "+253", label: "DJ" },
    { code: "+254", label: "KE" },
    { code: "+255", label: "TZ" },
    { code: "+256", label: "UG" },
    { code: "+257", label: "BI" },
    { code: "+258", label: "MZ" },
    { code: "+260", label: "ZM" },
    { code: "+261", label: "MG" },
    { code: "+262", label: "RE" },
    { code: "+263", label: "ZW" },
    { code: "+264", label: "NA" },
    { code: "+265", label: "MW" },
    { code: "+266", label: "LS" },
    { code: "+267", label: "BW" },
    { code: "+268", label: "SZ" },
    { code: "+269", label: "KM" },
    { code: "+297", label: "AW" },
    { code: "+298", label: "FO" },
    { code: "+299", label: "GL" },
    { code: "+350", label: "GI" },
    { code: "+351", label: "PT" },
    { code: "+352", label: "LU" },
    { code: "+353", label: "IE" },
    { code: "+354", label: "IS" },
    { code: "+355", label: "AL" },
    { code: "+356", label: "MT" },
    { code: "+357", label: "CY" },
    { code: "+358", label: "FI" },
    { code: "+359", label: "BG" },
    { code: "+370", label: "LT" },
    { code: "+371", label: "LV" },
    { code: "+372", label: "EE" },
    { code: "+373", label: "MD" },
    { code: "+374", label: "AM" },
    { code: "+375", label: "BY" },
    { code: "+376", label: "AD" },
    { code: "+377", label: "MC" },
    { code: "+378", label: "SM" },
    { code: "+379", label: "VA" },
    { code: "+380", label: "UA" },
    { code: "+381", label: "RS" },
    { code: "+382", label: "ME" },
    { code: "+383", label: "XK" },
    { code: "+385", label: "HR" },
    { code: "+386", label: "SI" },
    { code: "+387", label: "BA" },
    { code: "+389", label: "MK" },
    { code: "+420", label: "CZ" },
    { code: "+421", label: "SK" },
    { code: "+423", label: "LI" },
    { code: "+500", label: "FK" },
    { code: "+501", label: "BZ" },
    { code: "+502", label: "GT" },
    { code: "+503", label: "SV" },
    { code: "+504", label: "HN" },
    { code: "+505", label: "NI" },
    { code: "+506", label: "CR" },
    { code: "+507", label: "PA" },
    { code: "+509", label: "HT" },
    { code: "+591", label: "BO" },
    { code: "+592", label: "GY" },
    { code: "+593", label: "EC" },
    { code: "+595", label: "PY" },
    { code: "+597", label: "SR" },
    { code: "+598", label: "UY" },
    { code: "+599", label: "CW" },
    { code: "+670", label: "TL" },
    { code: "+672", label: "NF" },
    { code: "+673", label: "BN" },
    { code: "+674", label: "NR" },
    { code: "+675", label: "PG" },
    { code: "+676", label: "TO" },
    { code: "+677", label: "SB" },
    { code: "+678", label: "VU" },
    { code: "+679", label: "FJ" },
    { code: "+680", label: "PW" },
    { code: "+682", label: "CK" },
    { code: "+685", label: "WS" },
    { code: "+686", label: "KI" },
    { code: "+687", label: "NC" },
    { code: "+688", label: "TV" },
    { code: "+689", label: "PF" },
    { code: "+690", label: "TK" },
    { code: "+691", label: "FM" },
    { code: "+692", label: "MH" },
    { code: "+850", label: "KP" },
    { code: "+852", label: "HK" },
    { code: "+853", label: "MO" },
    { code: "+855", label: "KH" },
    { code: "+856", label: "LA" },
    { code: "+880", label: "BD" },
    { code: "+886", label: "TW" },
    { code: "+960", label: "MV" },
    { code: "+961", label: "LB" },
    { code: "+962", label: "JO" },
    { code: "+963", label: "SY" },
    { code: "+964", label: "IQ" },
    { code: "+965", label: "KW" },
    { code: "+966", label: "SA" },
    { code: "+967", label: "YE" },
    { code: "+968", label: "OM" },
    { code: "+970", label: "PS" },
    { code: "+971", label: "AE" },
    { code: "+972", label: "IL" },
    { code: "+973", label: "BH" },
    { code: "+974", label: "QA" },
    { code: "+975", label: "BT" },
    { code: "+976", label: "MN" },
    { code: "+977", label: "NP" },
    { code: "+992", label: "TJ" },
    { code: "+993", label: "TM" },
    { code: "+994", label: "AZ" },
    { code: "+995", label: "GE" },
    { code: "+996", label: "KG" },
    { code: "+998", label: "UZ" },
];

interface PhoneInputProps {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    defaultCountryCode?: string;
    countryCodes?: CountryCode[];
    placeholder?: string;
}

export function PhoneInput({
    id,
    value,
    onChange,
    defaultCountryCode = "+63",
    countryCodes = DEFAULT_COUNTRY_CODES,
    placeholder = "912 345 6789",
}: PhoneInputProps) {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    // Extract the country code from the current value, or use the default
    const resolveInitialCountry = useCallback(() => {
        for (const cc of countryCodes) {
            if (value.startsWith(cc.code)) {
                return cc.code;
            }
        }
        return defaultCountryCode;
    }, [value, countryCodes, defaultCountryCode]);

    const [country, setCountry] = useState(resolveInitialCountry);

    // Sync external value changes
    useEffect(() => {
        const matched = countryCodes.find((cc) => value.startsWith(cc.code));
        if (matched && matched.code !== country) {
            setCountry(matched.code);
        } else if (!matched && value === "") {
            setCountry(defaultCountryCode);
        }
    }, [value, countryCodes, defaultCountryCode, country]);

    // Extract the local number (without country code) for display
    const localNumber = value.startsWith(country) ? value.slice(country.length).trimStart() : value;

    const handleCountryChange = (newCode: string) => {
        setCountry(newCode);
        // Replace the country code prefix while preserving the local number
        const digitsOnly = value.replace(/^\+[\d]+\s*/, "");
        onChange(`${newCode} ${digitsOnly}`.trim());
    };

    const handleNumberChange = (raw: string) => {
        const digits = raw.replace(/\D/g, "");
        onChange(`${country} ${digits}`.trim());
    };

    return (
        <Field className="w-full">
            <InputGroup>
                <InputGroupAddon>
                    <DropdownMenu>
                        <DropdownMenuTrigger render={<InputGroupButton variant="ghost" />}>
                            <span className="tabular-nums">{country}</span>
                            <ChevronDownIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="max-h-64 min-w-32 overflow-y-auto">
                            {countryCodes.map((cc, i) => (
                                <DropdownMenuItem
                                    key={`${cc.code}-${cc.label}-${i}`}
                                    onClick={() => handleCountryChange(cc.code)}
                                >
                                    {cc.code} ({cc.label})
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </InputGroupAddon>
                <InputGroupInput
                    id={inputId}
                    type="tel"
                    value={localNumber}
                    onChange={(e) => handleNumberChange(e.target.value)}
                    placeholder={placeholder}
                />
            </InputGroup>
        </Field>
    );
}

import {MatrixValidationIssue} from "./stateTypes";

const COMMITTED_NUMBER_PATTERN = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;
const TEMPORARY_DRAFT_PATTERN = /^[+-]?(?:\d+)?(?:\.)?(?:\d+)?$/;

export interface NumericValidationResult {
    value: number | null;
    issues: MatrixValidationIssue[];
    isTemporaryDraft: boolean;
}

function issue(message: string): MatrixValidationIssue {
    return {code: "invalid_number", message};
}

export function isTemporarilyValidNumericDraft(raw: string): boolean {
    const trimmed = raw.trim();
    if (trimmed === "") {
        return true;
    }

    return TEMPORARY_DRAFT_PATTERN.test(trimmed);
}

export function validateCommittedNumericDraft(raw: string): NumericValidationResult {
    const trimmed = raw.trim();

    if (trimmed === "") {
        return {
            value: null,
            issues: [],
            isTemporaryDraft: false,
        };
    }

    if (["-", "+", ".", "-.", "+."].includes(trimmed)) {
        return {
            value: null,
            issues: [issue("Complete the number before committing.")],
            isTemporaryDraft: true,
        };
    }

    if (!COMMITTED_NUMBER_PATTERN.test(trimmed)) {
        return {
            value: null,
            issues: [issue("Use a number format like 12, -3, 0.25, or .5")],
            isTemporaryDraft: false,
        };
    }

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
        return {
            value: null,
            issues: [issue("Number is out of supported range.")],
            isTemporaryDraft: false,
        };
    }

    return {
        value: parsed,
        issues: [],
        isTemporaryDraft: false,
    };
}

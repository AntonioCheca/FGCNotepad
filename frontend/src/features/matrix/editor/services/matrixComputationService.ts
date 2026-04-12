export function computeExpectedValue(values: Array<Array<number | null>>, rowWeights: Array<number | null>, columnWeights: Array<number | null>): number | null {
    if (values.length === 0 || values[0]?.length === 0) {
        return null;
    }

    let expectedValue = 0;
    let hasUsableTerm = false;

    for (let rowIndex = 0; rowIndex < values.length; rowIndex++) {
        for (let columnIndex = 0; columnIndex < values[rowIndex].length; columnIndex++) {
            const value = values[rowIndex][columnIndex];
            const rowWeight = rowWeights[rowIndex];
            const columnWeight = columnWeights[columnIndex];

            if (value === null || rowWeight === null || columnWeight === null) {
                continue;
            }

            expectedValue += value * rowWeight * columnWeight;
            hasUsableTerm = true;
        }
    }

    return hasUsableTerm ? Number(expectedValue.toFixed(4)) : null;
}

import {AppAlert} from "@/src/components/ui/AppAlert";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppSnackbar} from "@/src/components/ui/AppSnackbar";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {useComboFormController} from "@/src/components/combos/create/hooks/useComboFormController";
import {RapidIngestionSection} from "@/src/components/combos/create/sections/RapidIngestionSection";
import {ParserVerificationSection} from "@/src/components/combos/create/sections/ParserVerificationSection";
import {SubmitSection} from "@/src/components/combos/create/sections/SubmitSection";

interface ComboFormProps {
    onSuccess?: () => void;
}

export default function ComboForm({onSuccess}: ComboFormProps) {
    const controller = useComboFormController({onSuccess});

    return (
        <AppBox component="form" onSubmit={controller.handleSubmit} sx={{display: "grid", gap: {xs: 1.5, md: 1.75}, width: "100%", maxWidth: 1160, mx: "auto"}}>
            <AppSnackbar
                open={controller.parseSuccessToastOpen}
                autoHideDuration={3200}
                anchorOrigin={{vertical: "top", horizontal: "center"}}
                onClose={(_, reason) => {
                    if (reason !== "clickaway") {
                        controller.setParseSuccessToastOpen(false);
                    }
                }}
            >
                <AppAlert severity="info" variant="filled" onClose={() => controller.setParseSuccessToastOpen(false)}>
                    Notation parsed into editable steps.
                </AppAlert>
            </AppSnackbar>

            {controller.notice ? <InlineNotice severity={controller.notice.severity}>{controller.notice.message}</InlineNotice> : null}

            <RapidIngestionSection
                character={controller.character}
                characterOptions={controller.characterOptions ?? []}
                charactersLoading={controller.charactersLoading}
                notationInput={controller.notationInput}
                canFillDetails={Boolean(controller.character?.id) && Boolean(controller.notationInput.trim()) && controller.leafs.length > 0}
                onCharacterChange={controller.setCharacter}
                onNotationChange={controller.setNotationInput}
                onFillDetails={controller.handleFillDetails}
            />

            <ParserVerificationSection
                hasParseResult={controller.hasParseResult}
                verificationTokens={controller.verificationTokens}
                errorByIndex={controller.errorByIndex}
                tokenToStepIndex={controller.tokenToStepIndex}
                selectedStepIndex={controller.selectedStepIndex}
                steps={controller.steps}
                selectedStep={controller.selectedStep}
                leafNameById={controller.leafNameById}
                leafs={controller.leafs}
                connections={controller.connections}
                connectionsLoading={controller.connectionsLoading}
                translateWarnings={controller.translateWarnings}
                translateErrors={controller.translateErrors}
                onSelectStep={controller.setSelectedStepIndex}
                onChangeStep={controller.handleChangeStep}
                onAddStep={controller.handleAddStep}
                onRemoveStep={controller.handleRemoveStep}
            />

            <SubmitSection
                title={controller.title}
                damage={controller.damage}
                driveCost={controller.driveCost}
                driveGain={controller.driveGain}
                superCost={controller.superCost}
                superGain={controller.superGain}
                description={controller.description}
                notes={controller.notes}
                canSubmit={controller.canSubmit}
                showAdvancedConditions={controller.showAdvancedConditions}
                requirements={controller.requirements}
                activeRequirementsCount={controller.activeRequirements.length}
                requirementObjects={controller.requirementObjects}
                selectedRequirementObject={controller.selectedRequirementObject}
                specificRequirementStatus={controller.specificRequirementStatus}
                selectedObjectIsInteger={controller.selectedObjectIsInteger}
                selectedObjectIsBoolean={controller.selectedObjectIsBoolean}
                onTitleChange={controller.setTitle}
                onDamageChange={controller.setDamage}
                onDriveCostChange={controller.setDriveCost}
                onDriveGainChange={controller.setDriveGain}
                onSuperCostChange={controller.setSuperCost}
                onSuperGainChange={controller.setSuperGain}
                onDescriptionChange={controller.setDescription}
                onNotesChange={controller.setNotes}
                onToggleAdvancedConditions={() => controller.setShowAdvancedConditions((prev) => !prev)}
                onResetDraft={controller.clearDraft}
                onRequirementToggle={controller.handleRequirementToggle}
                onSpecificRequirementObjectChange={(value) => {
                    controller.setSpecificRequirementObject(value?.name ?? "");
                    controller.setSpecificRequirementStatus("");
                }}
                onSpecificRequirementStatusChange={controller.setSpecificRequirementStatus}
            />
        </AppBox>
    );
}

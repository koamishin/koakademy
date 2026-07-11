import SmoothSelect, {
    type SelectOptionProps,
    type SelectProps as SmoothSelectProps,
} from "../../../../components/smoothui/select";
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";

type SelectItemProps = {
    children?: ReactNode;
    className?: string;
    disabled?: boolean;
    value: string;
};

type SelectValueProps = {
    children?: ReactNode;
    className?: string;
    placeholder?: ReactNode | ((value: unknown) => ReactNode);
};

type SelectTriggerProps = {
    "aria-label"?: string;
    "aria-labelledby"?: string;
    "aria-invalid"?: boolean | "true" | "false";
    children?: ReactNode;
    className?: string;
    disabled?: boolean;
    id?: string;
    name?: string;
    required?: boolean;
    size?: "sm" | "default";
};

type SelectContentProps = {
    align?: string;
    alignItemWithTrigger?: boolean;
    children?: ReactNode;
    className?: string;
    side?: string;
};

type SelectRootProps = Omit<SmoothSelectProps, "groups"> & {
    children?: ReactNode;
    items?: readonly SelectOptionProps[];
};

function SelectTrigger(_props: SelectTriggerProps): null {
    return null;
}

function SelectValue(_props: SelectValueProps): null {
    return null;
}

function SelectContent(_props: SelectContentProps): null {
    return null;
}

function SelectItem(_props: SelectItemProps): null {
    return null;
}

function SelectGroup(_props: { children?: ReactNode }): null {
    return null;
}

function SelectLabel(_props: { children?: ReactNode }): null {
    return null;
}

function SelectSeparator(_props: { children?: ReactNode }): null {
    return null;
}

function getElement<T>(children: ReactNode, type: unknown): ReactElement<T> | undefined {
    return Children.toArray(children).find(
        (child): child is ReactElement<T> => isValidElement(child) && child.type === type,
    );
}

function getOptions(children: ReactNode): SelectOptionProps[] {
    return Children.toArray(children).flatMap((child) => {
        if (!isValidElement(child)) {
            return [];
        }

        if (child.type === SelectItem) {
            const props = child.props as SelectItemProps;

            return [{
                disabled: props.disabled,
                label: props.children,
                value: props.value,
            }];
        }

        if (child.type === SelectGroup) {
            return getOptions((child.props as { children?: ReactNode }).children);
        }

        return [];
    });
}

function Select({ children, items, ...props }: SelectRootProps) {
    const trigger = getElement<SelectTriggerProps>(children, SelectTrigger);
    const content = getElement<SelectContentProps>(children, SelectContent);
    const value = getElement<SelectValueProps>(trigger?.props.children, SelectValue);
    const triggerProps = trigger?.props ?? {};
    const contentProps = content?.props ?? {};

    return (
        <SmoothSelect
            {...props}
            aria-invalid={props["aria-invalid"] ?? triggerProps["aria-invalid"]}
            aria-label={props["aria-label"] ?? triggerProps["aria-label"]}
            aria-labelledby={props["aria-labelledby"] ?? triggerProps["aria-labelledby"]}
            className={props.className ?? triggerProps.className}
            contentClassName={contentProps.className}
            disabled={props.disabled ?? triggerProps.disabled}
            id={triggerProps.id}
            name={props.name ?? triggerProps.name}
            onValueChange={props.onValueChange}
            options={props.options ?? items ?? getOptions(contentProps.children)}
            placeholder={
                props.placeholder ??
                (typeof value?.props.placeholder === "function" ? undefined : value?.props.placeholder)
            }
            required={props.required ?? triggerProps.required}
            size={props.size ?? triggerProps.size}
            value={props.value}
        />
    );
}

export {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
};

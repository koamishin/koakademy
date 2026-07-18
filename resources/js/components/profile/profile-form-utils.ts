export function formatPersonName(value: string): string {
    return value
        .trim()
        .replace(/\s+/g, " ")
        .split(" ")
        .map((part) =>
            part
                .split("-")
                .map((segment) =>
                    segment
                        .split("'")
                        .map((piece) => piece.charAt(0).toUpperCase() + piece.slice(1).toLowerCase())
                        .join("'"),
                )
                .join("-"),
        )
        .join(" ");
}

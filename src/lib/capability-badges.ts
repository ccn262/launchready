export type BadgeTone = "green" | "amber" | "red" | "grey";

function normalize(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function getAssetShortCode(code?: string | null, name?: string | null) {
  const normalizedCode = normalize(code);
  const normalizedName = normalize(name);

  if (normalizedCode.includes("tr") || normalizedName.includes("tractor")) {
    return "Tr";
  }

  if (normalizedCode.includes("dav") || normalizedName.includes("davit")) {
    return "Dav";
  }

  if (normalizedCode.includes("winch") || normalizedName.includes("winch")) {
    return "W";
  }

  if (normalizedCode.includes("hover") || normalizedName.includes("hovercraft")) {
    return "H";
  }

  if (normalizedCode.includes("b") || normalizedName.includes("bclass")) {
    return "B";
  }

  if (normalizedCode.includes("d") || normalizedName.includes("dclass")) {
    return "D";
  }

  if (normalizedCode.includes("e") || normalizedName.includes("eclass")) {
    return "E";
  }

  if (normalizedCode.includes("a") || normalizedName.includes("aclass")) {
    return "A";
  }

  if (normalizedCode.includes("rwc") || normalizedName.includes("rwc")) {
    return "RWC";
  }

  return code?.trim() || name?.trim()?.slice(0, 3) || "Asset";
}

export function getRoleShortCode(code?: string | null, name?: string | null) {
  const normalizedCode = normalize(code);
  const normalizedName = normalize(name);

  if (normalizedCode.includes("tier1") || normalizedName.includes("tier1")) {
    return "T1";
  }

  if (normalizedCode.includes("tier2") || normalizedName.includes("tier2")) {
    return "T2";
  }

  if (normalizedCode.includes("helm") || normalizedName.includes("helm")) {
    return "H";
  }

  if (normalizedCode.includes("pilot") || normalizedName.includes("pilot")) {
    return "P";
  }

  if (normalizedCode.includes("navigator") || normalizedName.includes("navigator")) {
    return "N";
  }

  if (normalizedCode.includes("tractordriver") || normalizedName.includes("tractordriver")) {
    return "DR";
  }

  if (normalizedCode.includes("winchoperator") || normalizedName.includes("winchoperator")) {
    return "OP";
  }

  if (normalizedCode.includes("davitoperator") || normalizedName.includes("davitoperator")) {
    return "OP";
  }

  if (normalizedCode.includes("commander") || normalizedName.includes("commander")) {
    return "C";
  }

  if (normalizedCode.includes("headlauncher") || normalizedName.includes("headlauncher")) {
    return "HL";
  }

  return code?.trim() || name?.trim()?.slice(0, 3) || "Role";
}

export function buildCapabilityBadgeLabel(
  assetShortCode: string,
  roleShortCode: string,
) {
  return `${assetShortCode}(${roleShortCode})`;
}

export function getBadgeTone(
  currencyState?: "green" | "amber" | "red" | null,
  isActive = true,
): BadgeTone {
  if (!isActive) {
    return "grey";
  }

  if (currencyState === "amber") {
    return "amber";
  }

  if (currencyState === "red") {
    return "red";
  }

  return "green";
}

export function buildCapabilityBadges<
  T extends {
    id: string;
    currency_state?: "green" | "amber" | "red" | null;
    is_active?: boolean;
    asset_type?:
      | { code: string | null; name: string | null }
      | { code: string | null; name: string | null }[]
      | null;
    asset?:
      | {
          asset_type_id: string | null;
          asset_type?:
            | { code: string | null; name: string | null }
            | { code: string | null; name: string | null }[]
            | null;
        }
      | {
          asset_type_id: string | null;
          asset_type?:
            | { code: string | null; name: string | null }
            | { code: string | null; name: string | null }[]
            | null;
        }[]
      | null;
    operational_role?:
      | { code: string | null; name: string | null }
      | { code: string | null; name: string | null }[]
      | null;
  },
>(records: T[]) {
  return records.map((record) => {
    const assetType =
      (Array.isArray(record.asset_type) ? record.asset_type[0] : record.asset_type) ??
      (record.asset && !Array.isArray(record.asset)
        ? Array.isArray(record.asset.asset_type)
          ? record.asset.asset_type[0] ?? null
          : record.asset.asset_type ?? null
        : null);
    const role =
      Array.isArray(record.operational_role) ? record.operational_role[0] : record.operational_role;

    const assetShortCode = getAssetShortCode(assetType?.code, assetType?.name);
    const roleShortCode = getRoleShortCode(role?.code, role?.name);

    return {
      id: record.id,
      label: buildCapabilityBadgeLabel(assetShortCode, roleShortCode),
      assetLabel: assetShortCode,
      roleLabel: roleShortCode,
      tone: getBadgeTone(record.currency_state, record.is_active !== false),
    };
  });
}

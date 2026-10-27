export interface RecordConsentInput {
  userId: string;
  type?: string;
  version?: string;
  userAgent?: string;
  ipHash?: string;
}

export async function hasUserConsented(
  supabaseClient: any,
  userId: string,
  type: string = "terms_and_disclaimer"
): Promise<boolean> {
  if (!userId) return false;

  try {
    const { data, error } = await supabaseClient
      .from("consents")
      .select("id, accepted_at")
      .eq("user_id", userId)
      .eq("type", type)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    return Boolean(data.accepted_at);
  } catch {
    return false;
  }
}

export async function recordUserConsent(
  supabaseClient: any,
  input: RecordConsentInput
): Promise<boolean> {
  const {
    userId,
    type = "terms_and_disclaimer",
    version = "1.0",
    userAgent,
    ipHash,
  } = input;

  if (!userId) return false;

  try {
    const { error } = await supabaseClient.from("consents").insert({
      user_id: userId,
      type,
      version,
      accepted_at: new Date().toISOString(),
      user_agent: userAgent || null,
      ip_hash: ipHash || null,
    });

    return !error;
  } catch {
    return false;
  }
}

interface DiscordUserInfo {
  id: string;
  username: string;
  discriminator: string;
}

export async function getUserInfo(
  accessToken: string
): Promise<DiscordUserInfo> {
  const req = await fetch("https://discord.com/api/v10/users/@me", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  return await req.json();
}

export interface DiscordAccessTokenInfo {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}

export async function getAccessToken(
  code: string
): Promise<DiscordAccessTokenInfo> {
  const req = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: process.env["DISCORD_CLIENT_ID"]!,
      client_secret: process.env["DISCORD_CLIENT_SECRET"]!,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: process.env["DISCORD_REDIRECT_URI"]!
    })
  });

  const res = await req.json();

  return {
    accessToken: res.access_token,
    expiresIn: res.expires_in,
    refreshToken: res.refresh_token
  };
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<DiscordAccessTokenInfo> {
  const req = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: process.env["DISCORD_CLIENT_ID"]!,
      client_secret: process.env["DISCORD_CLIENT_SECRET"]!,
      grant_type: "authorization_code",
      refresh_token: refreshToken
    })
  });

  const res = await req.json();

  return {
    accessToken: res.access_token,
    expiresIn: res.expires_in,
    refreshToken: res.refresh_token
  };
}

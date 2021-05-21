import React, { createContext, useContext, useMemo } from "react"
import useSWR, { SWRResponse } from "swr"
import { UserNotionAccessToken } from "../lib/models"
import { NotionApiClient } from "../lib/notion"
import { ListAccessTokensResponse } from "../pages/api/accessTokens"
import { useCurrentUserProfile } from "./Helpers"

// AccessTokensContext lists all access tokens.
interface AccessTokensContext {
	tokens: UserNotionAccessToken[]
	swr: SWRResponse<ListAccessTokensResponse, any> | undefined
}

const AccessTokensContext = createContext<AccessTokensContext>({
	tokens: [],
	swr: undefined,
})
AccessTokensContext.displayName = "NotionAccessTokens"

export function AccessTokensProvider(props: { children: React.ReactNode }) {
	const user = useCurrentUserProfile()
	const swr = useSWR<ListAccessTokensResponse>(
		user ? "/api/accessTokens" : null,
		path => fetch(path).then(res => res.json())
	)

	const value: AccessTokensContext = useMemo(() => {
		return {
			tokens: swr?.data?.tokens ?? [],
			swr,
		}
	}, [swr])

	return (
		<AccessTokensContext.Provider value={value}>
			{props.children}
		</AccessTokensContext.Provider>
	)
}

/**
 * All access tokens the user has connected.
 */
export function useAccessTokens() {
	return useContext(AccessTokensContext)
}

/**
 * CurrenAccessTokenContext provides a single access token and a client
 * that uses it.
 */
interface CurrentAccessTokenContext {
	tokenId: string
	token: UserNotionAccessToken | undefined
	notion: NotionApiClient
}

const CurrentAccessTokenContext = createContext<
	CurrentAccessTokenContext | undefined
>(undefined)
CurrentAccessTokenContext.displayName = "CurrentAccessToken"

export function CurrentAccessTokenProvider(props: {
	children: React.ReactNode
	tokenId: string
	token?: UserNotionAccessToken
	notion?: NotionApiClient
}) {
	const { children, tokenId, token, notion: givenClient } = props
	if (token && tokenId !== token.id) {
		throw new Error(`Token ID mismatch: id ${tokenId} != object id ${token.id}`)
	}

	const client = useMemo(
		() => givenClient ?? NotionApiClient.withBrowserToken({ id: tokenId }),
		[givenClient, tokenId]
	)

	const value: CurrentAccessTokenContext = useMemo(() => {
		return {
			tokenId,
			notion: client,
			token,
		}
	}, [tokenId, client, token])

	return (
		<CurrentAccessTokenContext.Provider value={value}>
			{children}
		</CurrentAccessTokenContext.Provider>
	)
}

/**
 * Contextual access token and a client that uses it to talk to Notion.
 */
export function useCurrentAccessToken() {
	return useContext(CurrentAccessTokenContext)
}

export function useNotionApiClient(accessTokenId: string | undefined) {
	const contextClient = useCurrentAccessToken()?.notion
	if (!contextClient && !accessTokenId) {
		throw new Error("No access token provided")
	}

	const localClient = useMemo(() => {
		if (accessTokenId) {
			return NotionApiClient.withBrowserToken({ id: accessTokenId })
		}
	}, [accessTokenId])

	return localClient || contextClient
}

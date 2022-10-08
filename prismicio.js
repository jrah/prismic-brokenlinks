import * as prismic from '@prismicio/client'
export const endpoint = `https://${process.env.NEXT_PUBLIC_REPO_NAME}.cdn.prismic.io/api/v2`
export const repositoryName = prismic.getRepositoryName(endpoint)

// Update the Link Resolver to match your project's route structure
export function linkResolver(doc) {
  switch (doc.type) {
    case 'homepage':
      return '/'
    case 'page':
      return `/${doc.uid}`
    default:
      return null
  }
}

// This factory function allows smooth preview setup
export function createClient(config = {endpoint}) {
  const client = prismic.createClient(endpoint, {
    ...config,
  })

  return client
}
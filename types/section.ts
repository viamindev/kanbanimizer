export type Section = {
    id: string,
    name: string,
    authorId: string,
    createdAt: string,
    updatedAt: string,
    author: {
        id: string,
        name: string
    }
}
export default defineNuxtRouteMiddleware(async (to, from) => {
    const pinia = usePinia()
    if (pinia) {
        console.log("pinia installed")
    }
})
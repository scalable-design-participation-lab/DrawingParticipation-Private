export default defineNuxtRouteMiddleware((to, from) => {
    if (to.path === '/map') {
        return navigateTo('/result')
    }
})
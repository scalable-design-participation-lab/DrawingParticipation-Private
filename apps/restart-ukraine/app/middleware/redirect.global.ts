export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/map') {
    return navigateTo('/result')
  }
})

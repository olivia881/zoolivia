package it.prisma.mobile

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import it.prisma.mobile.ui.home.HomeScreen
import it.prisma.mobile.ui.home.HomeViewModel
import it.prisma.mobile.ui.settings.SettingsScreen

@Composable
fun PrismaMobileApp(viewModel: HomeViewModel) {
    val navController = rememberNavController()
    NavHost(navController = navController, startDestination = "home") {
        composable("home") {
            HomeScreen(
                viewModel = viewModel,
                onOpenSettings = { navController.navigate("settings") },
            )
        }
        composable("settings") {
            SettingsScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
            )
        }
    }
}

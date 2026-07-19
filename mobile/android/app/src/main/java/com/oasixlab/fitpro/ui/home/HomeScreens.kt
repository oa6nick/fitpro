package com.oasixlab.fitpro.ui.home

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.Checklist
import androidx.compose.material.icons.filled.Construction
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.ShowChart
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.oasixlab.fitpro.data.api.User
import com.oasixlab.fitpro.ui.client.ClientProfileTab
import com.oasixlab.fitpro.ui.client.KnowledgeTab
import com.oasixlab.fitpro.ui.client.MeasurementsTab
import com.oasixlab.fitpro.ui.client.TasksTab
import com.oasixlab.fitpro.ui.client.WorkoutsTab
import com.oasixlab.fitpro.ui.trainer.ClientsTab
import com.oasixlab.fitpro.ui.trainer.DashboardTab
import com.oasixlab.fitpro.ui.trainer.ReviewTab
import com.oasixlab.fitpro.ui.trainer.StudioTab
import com.oasixlab.fitpro.ui.trainer.TrainerProfileTab

private data class Tab(val title: String, val icon: ImageVector)

private val CLIENT_TABS = listOf(
    Tab("Дневник", Icons.Default.FitnessCenter),
    Tab("Замеры", Icons.Default.ShowChart),
    Tab("Задачи", Icons.Default.Checklist),
    Tab("Материалы", Icons.AutoMirrored.Filled.MenuBook),
    Tab("Профиль", Icons.Default.Person),
)

/** Лейбл вкладки: один ряд, без caption-трекинга (labelSmall темы = 0.22em — широко). */
@Composable
private fun TabLabel(title: String) {
    Text(
        title,
        fontSize = 11.sp,
        letterSpacing = 0.01.em,
        maxLines = 1,
        softWrap = false,
    )
}

/** Кабинет клиента — Ф2, работает поверх реального API. */
@Composable
fun ClientHomeScreen(user: User, onLogout: () -> Unit) {
    var selected by rememberSaveable { mutableIntStateOf(0) }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                CLIENT_TABS.forEachIndexed { index, tab ->
                    NavigationBarItem(
                        selected = selected == index,
                        onClick = { selected = index },
                        icon = { Icon(tab.icon, contentDescription = tab.title) },
                        label = { TabLabel(tab.title) },
                    )
                }
            }
        },
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            when (selected) {
                0 -> WorkoutsTab()
                1 -> MeasurementsTab()
                2 -> TasksTab()
                3 -> KnowledgeTab()
                else -> ClientProfileTab(user, onLogout)
            }
        }
    }
}

private val TRAINER_TABS = listOf(
    Tab("Дашборд", Icons.Default.Dashboard),
    Tab("Клиенты", Icons.Default.Group),
    Tab("Проверка", Icons.Default.Description),
    Tab("Студия", Icons.Default.Construction),
    Tab("Профиль", Icons.Default.Person),
)

/** Кабинет тренера — Ф3: дежурные сценарии поверх реального API. */
@Composable
fun TrainerHomeScreen(user: User, onLogout: () -> Unit) {
    var selected by rememberSaveable { mutableIntStateOf(0) }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                TRAINER_TABS.forEachIndexed { index, tab ->
                    NavigationBarItem(
                        selected = selected == index,
                        onClick = { selected = index },
                        icon = { Icon(tab.icon, contentDescription = tab.title) },
                        label = { TabLabel(tab.title) },
                    )
                }
            }
        },
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            when (selected) {
                0 -> DashboardTab()
                1 -> ClientsTab()
                2 -> ReviewTab()
                3 -> StudioTab()
                else -> TrainerProfileTab(user, onLogout)
            }
        }
    }
}

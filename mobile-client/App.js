import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";

const API_URL = "http://192.168.0.18:8083/api";

export default function App() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadUsers() {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/users`);

      if (!response.ok) {
        throw new Error("Не удалось получить список пользователей");
      }

      const data = await response.json();
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (error) {
      Alert.alert("Ошибка", error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function clearForm() {
    setName("");
    setEmail("");
    setEditingId(null);
  }

  async function saveUser() {
    if (!name.trim() || !email.trim()) {
      Alert.alert("Внимание", "Заполните оба поля");
      return;
    }

    try {
      const url = editingId
        ? `${API_URL}/users/${editingId}`
        : `${API_URL}/users`;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Не удалось сохранить пользователя");
      }

      clearForm();
      await loadUsers();
      Alert.alert("Успешно", "Данные сохранены");
    } catch (error) {
      Alert.alert("Ошибка", error.message);
    }
  }

  function editUser(user) {
    setName(user.name);
    setEmail(user.email);
    setEditingId(user.id);
  }

  function deleteUser(id) {
    Alert.alert("Удаление", "Удалить выбранного пользователя?", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetch(`${API_URL}/users/${id}`, {
              method: "DELETE",
            });

            if (!response.ok) {
              throw new Error("Не удалось удалить пользователя");
            }

            await loadUsers();
          } catch (error) {
            Alert.alert("Ошибка", error.message);
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Мои пользователи</Text>

      <View style={styles.form}>
        <Text style={styles.subtitle}>
          {editingId ? "Редактирование" : "Новый пользователь"}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Имя"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Электронная почта"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Pressable style={styles.saveButton} onPress={saveUser}>
          <Text style={styles.buttonText}>
            {editingId ? "Сохранить изменения" : "Добавить пользователя"}
          </Text>
        </Pressable>

        {editingId !== null && (
          <Pressable style={styles.cancelButton} onPress={clearForm}>
            <Text style={styles.buttonText}>Отмена</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.subtitle}>Список пользователей</Text>
        <Pressable onPress={loadUsers}>
          <Text style={styles.refresh}>Обновить</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <Text style={styles.empty}>Пользователей пока нет</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
              </View>

              <View style={styles.actions}>
                <Pressable onPress={() => editUser(item)}>
                  <Text style={styles.edit}>Изменить</Text>
                </Pressable>

                <Pressable onPress={() => deleteUser(item.id)}>
                  <Text style={styles.delete}>Удалить</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: 20,
    paddingTop: 35,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#172554",
    marginBottom: 20,
  },
  form: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 22,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1e293b",
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#64748b",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  refresh: {
    color: "#2563eb",
    fontWeight: "bold",
  },
  userCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  userInfo: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0f172a",
  },
  userEmail: {
    color: "#64748b",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 20,
  },
  edit: {
    color: "#2563eb",
    fontWeight: "bold",
  },
  delete: {
    color: "#dc2626",
    fontWeight: "bold",
  },
  empty: {
    textAlign: "center",
    color: "#64748b",
    marginTop: 20,
  },
});

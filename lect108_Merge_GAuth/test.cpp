#include <iostream>
#include <vector>
#include <queue>

class Node {
public:
    Node* left;
    Node* right;
    int val;
    Node(int val) {
        this->left = nullptr;
        this->right = nullptr;
        this->val = val;
    }
};

Node* buildTreeFromArray(const std::vector<int>& arr) {
    if (arr.empty()) return nullptr;
    Node* root = new Node(arr[0]);
    std::queue<Node*> q;
    q.push(root);
    int i = 1;
    while (!q.empty() && i < arr.size()) {
        Node* curr = q.front();
        q.pop();
        if (i < arr.size()) {
            curr->left = new Node(arr[i++]);
            q.push(curr->left);
        }
        if (i < arr.size()) {
            curr->right = new Node(arr[i++]);
            q.push(curr->right);
        }
    }
    return root;
}

void inorderTraversal(Node* root) {
    if (root) {
        inorderTraversal(root->left);
        std::cout << root->val << " ";
        inorderTraversal(root->right);
    }
}

int main() {
    std::vector<int> arr = {1, 2, 3, 4, 5, 6, 7};
    Node* root = buildTreeFromArray(arr);
    std::cout << "Inorder traversal: ";
    inorderTraversal(root);
    std::cout << std::endl;
    // Remember to free memory in a real application
    return 0;
}
import torch
import torch.nn as nn
import pytorch_lightning as pl

class WeeklyForecastModel(pl.LightningModule):
    def __init__(self, input_dim, hidden_dim=64):
        super().__init__()

        self.lstm = nn.LSTM(
            input_dim,
            hidden_dim,
            num_layers=2,
            batch_first=True,
            dropout=0.2
        )

        self.head = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 4)
        )

    def forward(self, x):
        _, (h_n, _) = self.lstm(x)
        return self.head(h_n[-1])
